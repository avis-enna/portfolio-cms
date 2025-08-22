import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/docs
 * Return OpenAPI/Swagger documentation
 */
export async function GET(request: NextRequest) {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio CMS API',
      version: '1.0.0',
      description: 'REST API for Portfolio Content Management System',
      contact: {
        name: 'API Support',
        email: 'support@portfolio-cms.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com/api' 
          : 'http://localhost:3002/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          description: 'Authenticate user and return access tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'password'],
                  properties: {
                    username: {
                      type: 'string',
                      description: 'Username or email',
                      example: 'admin'
                    },
                    password: {
                      type: 'string',
                      description: 'User password',
                      example: 'admin123'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LoginResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '429': {
              description: 'Too many requests',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RateLimitResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/auth/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token',
          description: 'Get new access token using refresh token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: {
                      type: 'string',
                      description: 'Valid refresh token'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TokenResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Invalid refresh token'
            }
          }
        }
      },
      '/blog': {
        get: {
          tags: ['Public Blog'],
          summary: 'Get published blog posts',
          description: 'Retrieve paginated list of published blog posts',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Posts per page (max 50)',
              schema: { type: 'integer', default: 10, maximum: 50 }
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search in title, excerpt, tags, categories',
              schema: { type: 'string' }
            },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by category',
              schema: { type: 'string' }
            },
            {
              name: 'tag',
              in: 'query',
              description: 'Filter by tag',
              schema: { type: 'string' }
            },
            {
              name: 'sortBy',
              in: 'query',
              description: 'Sort field',
              schema: { 
                type: 'string', 
                enum: ['publishedAt', 'createdAt', 'title', 'viewCount', 'displayOrder'],
                default: 'publishedAt'
              }
            },
            {
              name: 'sortOrder',
              in: 'query',
              description: 'Sort order',
              schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
            }
          ],
          responses: {
            '200': {
              description: 'Blog posts retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/BlogPostsResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/blog/{slug}': {
        get: {
          tags: ['Public Blog'],
          summary: 'Get blog post by slug',
          description: 'Retrieve a specific published blog post by its slug',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              description: 'Blog post slug',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Blog post retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/BlogPostResponse'
                  }
                }
              }
            },
            '404': {
              description: 'Blog post not found'
            }
          }
        }
      },
      '/contact': {
        post: {
          tags: ['Contact'],
          summary: 'Submit contact form',
          description: 'Submit a contact form message',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ContactSubmission'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Contact form submitted successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ContactResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Validation error'
            },
            '429': {
              description: 'Too many submissions'
            }
          }
        }
      },
      '/admin/blog': {
        get: {
          tags: ['Admin Blog'],
          summary: 'Get all blog posts (admin)',
          description: 'Retrieve all blog posts with admin privileges',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 }
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['all', 'draft', 'published'], default: 'all' }
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Blog posts retrieved successfully'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        },
        post: {
          tags: ['Admin Blog'],
          summary: 'Create blog post',
          description: 'Create a new blog post',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BlogPostCreate'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Blog post created successfully'
            },
            '400': {
              description: 'Validation error'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        }
      },
      '/admin/upload': {
        post: {
          tags: ['Admin Upload'],
          summary: 'Upload file',
          description: 'Upload files (images, documents)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'File to upload'
                    },
                    type: {
                      type: 'string',
                      enum: ['image', 'document', 'general'],
                      default: 'general',
                      description: 'Upload type'
                    }
                  },
                  required: ['file']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'File uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UploadResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid file or validation error'
            },
            '401': {
              description: 'Unauthorized'
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        },
        TokenResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' }
          }
        },
        BlogPost: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published'] },
            author: { $ref: '#/components/schemas/User' },
            publishedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' } },
            categories: { type: 'array', items: { type: 'string' } },
            featuredImage: { type: 'string' },
            readingTime: { type: 'integer' },
            viewCount: { type: 'integer' },
            seoMetadata: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        BlogPostCreate: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', maxLength: 200 },
            content: { type: 'string', maxLength: 50000 },
            excerpt: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published'], default: 'draft' },
            tags: { type: 'array', items: { type: 'string' } },
            categories: { type: 'array', items: { type: 'string' } },
            featuredImage: { type: 'string' },
            seoMetadata: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        ContactSubmission: {
          type: 'object',
          required: ['name', 'email', 'message'],
          properties: {
            name: { type: 'string', maxLength: 100 },
            email: { type: 'string', format: 'email', maxLength: 254 },
            message: { type: 'string', maxLength: 5000 },
            subject: { type: 'string', maxLength: 200 }
          }
        },
        ContactResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                submissionId: { type: 'string' },
                submittedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        UploadResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                fileName: { type: 'string' },
                originalName: { type: 'string' },
                fileType: { type: 'string' },
                fileSize: { type: 'integer' },
                uploadType: { type: 'string' },
                url: { type: 'string' },
                uploadedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            details: { type: 'object' }
          }
        },
        RateLimitResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            retryAfter: { type: 'integer', description: 'Seconds to wait before retry' }
          }
        }
      }
    }
  }

  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    }
  })
}
