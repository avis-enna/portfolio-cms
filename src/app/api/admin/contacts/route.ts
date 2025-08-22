import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { connectToDatabase } from '@/lib/database/connection'
import { ContactSubmission } from '@/lib/database/models'

/**
 * GET /api/admin/contacts
 * Get all contact submissions with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build filter query
    let filterQuery = {}
    if (filter === 'new') {
      filterQuery = { isRead: false }
    } else if (filter === 'read') {
      filterQuery = { isRead: true }
    }

    // Get contacts with pagination
    const [contacts, totalCount] = await Promise.all([
      ContactSubmission.find(filterQuery)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactSubmission.countDocuments(filterQuery)
    ])

    // Transform contacts to match frontend interface
    const transformedContacts = contacts.map(contact => ({
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      message: contact.message,
      status: contact.isRead ? 'read' : 'new',
      createdAt: contact.submittedAt.toISOString()
    }))

    return NextResponse.json(
      {
        success: true,
        data: {
          contacts: transformedContacts,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contacts API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/contacts
 * Update contact status (mark as read, replied, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { contactId, status } = body

    if (!contactId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contact ID and status are required',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Update contact status
    const updateData: any = {}
    if (status === 'read' || status === 'replied') {
      updateData.isRead = true
    } else if (status === 'new') {
      updateData.isRead = false
    }

    const updatedContact = await ContactSubmission.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
    )

    if (!updatedContact) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contact not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          contact: {
            id: updatedContact._id.toString(),
            name: updatedContact.name,
            email: updatedContact.email,
            message: updatedContact.message,
            status: updatedContact.isRead ? 'read' : 'new',
            createdAt: updatedContact.submittedAt.toISOString()
          }
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact update API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/contacts
 * Delete a contact submission
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: 401 }
      )
    }

    // Get contact ID from query params
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('id')

    if (!contactId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contact ID is required',
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Delete contact
    const deletedContact = await ContactSubmission.findByIdAndDelete(contactId)

    if (!deletedContact) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contact not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Contact deleted successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact delete API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
