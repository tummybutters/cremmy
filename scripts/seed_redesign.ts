import { db } from '../src/server/infra/db';
import { generateId } from '../src/server/infra/db';
import dotenv from 'dotenv';

dotenv.config();

async function seedClients() {
    console.log('Seeding clients...');

    await db.withTransaction(async (tx) => {
        // 1. Mobile Detailing Company
        const mobileDetailingId = generateId();
        await tx.insert('clients', {
            id: mobileDetailingId,
            name: 'Mobile Detailing Co',
            company: 'Mobile Detailing Co',
            lifecycle_stage: 'active',
            description: 'Website hosting, Twilio local service ads texting automation.',
            payment_type: 'monthly',
            recurring_amount: 100,
            last_payment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        console.log('Inserted Mobile Detailing Co');

        // 2. General Contracting Company
        const generalContractingId = generateId();
        await tx.insert('clients', {
            id: generalContractingId,
            name: 'General Contracting Inc',
            company: 'General Contracting Inc',
            lifecycle_stage: 'active',
            description: 'RAG DB for website, quote generation tool connected to QuickBooks.',
            payment_type: 'one_time',
            total_value: 2500,
            last_payment_date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        console.log('Inserted General Contracting Inc');
    });

    console.log('Seeding complete.');
}

seedClients().catch(console.error);
