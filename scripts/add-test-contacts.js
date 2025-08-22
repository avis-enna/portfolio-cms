#!/usr/bin/env node

/**
 * Script to add test contact data to the database
 * This helps test the contact count synchronization bug fix
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-cms';

const testContacts = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Project Collaboration Inquiry',
    message: 'Hi, I\'m interested in collaborating on a project. Could we schedule a call to discuss?',
    isRead: false,
    isSpam: false,
    source: 'contact-form',
    submittedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    name: 'Sarah Smith',
    email: 'sarah@company.com',
    subject: 'Job Opportunity',
    message: 'We have a job opportunity that might interest you. Please check your email for details.',
    isRead: true,
    isSpam: false,
    source: 'contact-form',
    submittedAt: new Date('2024-01-14T15:30:00Z')
  },
  {
    name: 'Mike Johnson',
    email: 'mike@startup.io',
    subject: 'Team Invitation',
    message: 'Love your portfolio! Would you be interested in joining our team as a senior developer?',
    isRead: false,
    isSpam: false,
    source: 'contact-form',
    submittedAt: new Date('2024-01-13T09:15:00Z')
  },
  {
    name: 'Emily Chen',
    email: 'emily@design.co',
    subject: 'Freelance Project',
    message: 'I saw your work on GitHub and I\'m impressed. We have a freelance project that might interest you.',
    isRead: false,
    isSpam: false,
    source: 'contact-form',
    submittedAt: new Date('2024-01-12T14:20:00Z')
  },
  {
    name: 'David Wilson',
    email: 'david@tech.com',
    subject: 'Technical Interview',
    message: 'Would you be available for a technical interview next week? We have an exciting opportunity.',
    isRead: true,
    isSpam: false,
    source: 'contact-form',
    submittedAt: new Date('2024-01-11T11:45:00Z')
  }
];

async function addTestContacts() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const contactsCollection = db.collection('contactsubmissions');
    
    // Clear existing test contacts
    console.log('🧹 Clearing existing contacts...');
    await contactsCollection.deleteMany({});
    
    // Insert test contacts
    console.log('📝 Adding test contacts...');
    const result = await contactsCollection.insertMany(testContacts);
    
    console.log(`✅ Successfully added ${result.insertedCount} test contacts`);
    
    // Show summary
    const totalContacts = await contactsCollection.countDocuments();
    const unreadContacts = await contactsCollection.countDocuments({ isRead: false });
    
    console.log('\n📊 Contact Summary:');
    console.log(`   Total contacts: ${totalContacts}`);
    console.log(`   Unread contacts: ${unreadContacts}`);
    console.log(`   Read contacts: ${totalContacts - unreadContacts}`);
    
    console.log('\n🎯 Test the contact count synchronization:');
    console.log('   1. Check dashboard - should show correct unread count');
    console.log('   2. Go to contact management - should show all contacts');
    console.log('   3. Mark a contact as read - dashboard should update');
    
  } catch (error) {
    console.error('❌ Error adding test contacts:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
addTestContacts().catch(console.error);
