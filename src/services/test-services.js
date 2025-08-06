// Test file for the new expense analytics services
import { ExpenseAnalytics } from './ExpenseAnalytics';
import { OpenAIService } from './OpenAIService';
import { QuestionProcessor } from './QuestionProcessor';
// Mock Supabase client for testing
const mockSupabase = {
    from: (table) => ({
        select: () => ({
            eq: () => ({
                order: () => ({
                    limit: () => Promise.resolve({
                        data: [
                            {
                                id: '1',
                                expense_date: '2024-01-01',
                                vendor: 'Test Store',
                                amount: 100,
                                quantity: 1,
                                description: 'Test expense',
                                category: 'Food',
                                user_id: 'test-user',
                                created_at: '2024-01-01T00:00:00Z'
                            }
                        ],
                        error: null
                    })
                })
            })
        })
    })
};
export async function testServices() {
    try {
        console.log('Testing new expense analytics services...');
        // Test ExpenseAnalytics
        const analytics = new ExpenseAnalytics(mockSupabase);
        const result = await analytics.analyzeExpenses('test-user');
        console.log('Analytics result:', result);
        // Test OpenAIService
        const openAI = new OpenAIService();
        console.log('OpenAI service initialized');
        // Test QuestionProcessor
        const questionProcessor = new QuestionProcessor(analytics, openAI);
        console.log('Question processor initialized');
        console.log('All services initialized successfully!');
        return true;
    }
    catch (error) {
        console.error('Error testing services:', error);
        return false;
    }
}
