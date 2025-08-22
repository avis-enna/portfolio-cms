#!/usr/bin/env node

/**
 * Debug script to test database connection and model queries directly
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-cms';

async function debugDatabaseConnection() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', MONGODB_URI);
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ Connected to database:', db.databaseName);
    
    // List all collections
    console.log('\n📋 Available collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check contactsubmissions collection specifically
    console.log('\n📧 Checking contactsubmissions collection:');
    const contactsCollection = db.collection('contactsubmissions');
    
    // Get all documents
    const allContacts = await contactsCollection.find({}).toArray();
    console.log(`   Total documents: ${allContacts.length}`);
    
    if (allContacts.length > 0) {
      console.log('\n📄 Sample document structure:');
      console.log(JSON.stringify(allContacts[0], null, 2));
      
      // Check for required fields
      console.log('\n🔍 Field analysis:');
      const sampleDoc = allContacts[0];
      console.log(`   - isRead: ${sampleDoc.isRead} (${typeof sampleDoc.isRead})`);
      console.log(`   - isSpam: ${sampleDoc.isSpam} (${typeof sampleDoc.isSpam})`);
      console.log(`   - name: ${sampleDoc.name} (${typeof sampleDoc.name})`);
      console.log(`   - email: ${sampleDoc.email} (${typeof sampleDoc.email})`);
      console.log(`   - message: ${sampleDoc.message ? 'present' : 'missing'}`);
      console.log(`   - submittedAt: ${sampleDoc.submittedAt} (${typeof sampleDoc.submittedAt})`);
    }
    
    // Test the exact query used by the API
    console.log('\n🔍 Testing API query filters:');
    
    // Test 1: No filter (should return all)
    const allQuery = await contactsCollection.find({}).toArray();
    console.log(`   All documents: ${allQuery.length}`);
    
    // Test 2: Filter by isSpam: false (API default)
    const notSpamQuery = await contactsCollection.find({ isSpam: false }).toArray();
    console.log(`   Not spam: ${notSpamQuery.length}`);
    
    // Test 3: Filter by isRead: false (unread)
    const unreadQuery = await contactsCollection.find({ isRead: false }).toArray();
    console.log(`   Unread: ${unreadQuery.length}`);
    
    // Test 4: Combined filter (not spam AND unread)
    const combinedQuery = await contactsCollection.find({ 
      isRead: false, 
      isSpam: false 
    }).toArray();
    console.log(`   Unread AND not spam: ${combinedQuery.length}`);
    
    // Test 5: Sort by submittedAt (API default)
    const sortedQuery = await contactsCollection.find({ isSpam: false })
      .sort({ submittedAt: -1 })
      .toArray();
    console.log(`   Sorted by submittedAt: ${sortedQuery.length}`);
    
    if (sortedQuery.length > 0) {
      console.log('\n📊 Query results summary:');
      sortedQuery.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.name} - ${contact.isRead ? 'read' : 'unread'} - ${contact.isSpam ? 'spam' : 'not spam'}`);
      });
    }
    
    // Test the exact transformation used by the API
    console.log('\n🔄 Testing API transformation:');
    const transformedContacts = sortedQuery.map(contact => ({
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      message: contact.message,
      status: contact.isRead ? 'read' : 'new',
      createdAt: contact.submittedAt.toISOString()
    }));
    
    console.log(`   Transformed contacts: ${transformedContacts.length}`);
    if (transformedContacts.length > 0) {
      console.log('   Sample transformed contact:');
      console.log(JSON.stringify(transformedContacts[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Database debug failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the debug
debugDatabaseConnection().catch(console.error);
