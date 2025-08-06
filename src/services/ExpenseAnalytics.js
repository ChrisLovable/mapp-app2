import { SupabaseClient } from '@supabase/supabase-js';
export class ExpenseAnalytics {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async analyzeExpenses(userId, filters) {
        try {
            // Get base query
            let query = this.supabase
                .from('expense_tracker')
                .select('*')
                .eq('user_id', userId);
            // Apply filters
            if (filters?.startDate) {
                query = query.gte('expense_date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('expense_date', filters.endDate);
            }
            if (filters?.category) {
                query = query.eq('category', filters.category);
            }
            if (filters?.vendor) {
                query = query.eq('vendor', filters.vendor);
            }
            if (filters?.minAmount) {
                query = query.gte('amount', filters.minAmount);
            }
            if (filters?.maxAmount) {
                query = query.lte('amount', filters.maxAmount);
            }
            const { data, error } = await query.order('expense_date', { ascending: false });
            if (error) {
                console.error('Error fetching expenses:', error);
                throw error;
            }
            return this.processExpenseData(data || []);
        }
        catch (error) {
            console.error('Error in analyzeExpenses:', error);
            throw error;
        }
    }
    processExpenseData(expenses) {
        if (!expenses || expenses.length === 0) {
            return {
                summary: this.getEmptySummary(),
                categories: this.getEmptyCategoryAnalysis(),
                vendors: this.getEmptyVendorAnalysis(),
                trends: this.getEmptyTrendAnalysis(),
                insights: this.getEmptyInsights()
            };
        }
        return {
            summary: this.calculateSummary(expenses),
            categories: this.analyzeCategories(expenses),
            vendors: this.analyzeVendors(expenses),
            trends: this.calculateTrends(expenses),
            insights: this.generateInsights(expenses)
        };
    }
    calculateSummary(expenses) {
        const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const totalEntries = expenses.length;
        const totalQuantity = expenses.reduce((sum, expense) => sum + (expense.quantity || 1), 0);
        const averageAmount = totalEntries > 0 ? totalExpenses / totalEntries : 0;
        const dates = expenses.map(e => e.expense_date).filter(Boolean);
        const earliest = dates.length > 0 ? Math.min(...dates.map(d => new Date(d).getTime())) : null;
        const latest = dates.length > 0 ? Math.max(...dates.map(d => new Date(d).getTime())) : null;
        return {
            totalExpenses,
            totalEntries,
            totalQuantity,
            averageAmount,
            dateRange: {
                earliest: earliest ? new Date(earliest).toISOString().split('T')[0] : '',
                latest: latest ? new Date(latest).toISOString().split('T')[0] : ''
            }
        };
    }
    analyzeCategories(expenses) {
        const categoryTotals = {};
        const categoryCounts = {};
        const categoryQuantities = {};
        expenses.forEach(expense => {
            const category = expense.category || 'Uncategorized';
            categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            categoryQuantities[category] = (categoryQuantities[category] || 0) + (expense.quantity || 1);
        });
        const topCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([category, total]) => ({
            category,
            total,
            count: categoryCounts[category],
            quantity: categoryQuantities[category],
            average: categoryCounts[category] > 0 ? total / categoryCounts[category] : 0
        }));
        return {
            topCategories,
            categoryBreakdown: categoryTotals
        };
    }
    analyzeVendors(expenses) {
        const vendorTotals = {};
        const vendorCounts = {};
        const vendorQuantities = {};
        expenses.forEach(expense => {
            const vendor = expense.vendor || 'Unknown Vendor';
            vendorTotals[vendor] = (vendorTotals[vendor] || 0) + (expense.amount || 0);
            vendorCounts[vendor] = (vendorCounts[vendor] || 0) + 1;
            vendorQuantities[vendor] = (vendorQuantities[vendor] || 0) + (expense.quantity || 1);
        });
        const topVendors = Object.entries(vendorTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([vendor, total]) => ({
            vendor,
            total,
            count: vendorCounts[vendor],
            quantity: vendorQuantities[vendor],
            average: vendorCounts[vendor] > 0 ? total / vendorCounts[vendor] : 0
        }));
        return {
            topVendors,
            vendorBreakdown: vendorTotals
        };
    }
    calculateTrends(expenses) {
        const monthlyTotals = {};
        const monthlyCounts = {};
        expenses.forEach(expense => {
            if (expense.expense_date) {
                const monthKey = expense.expense_date.substring(0, 7); // YYYY-MM format
                monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (expense.amount || 0);
                monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
            }
        });
        const monthlyAverages = {};
        Object.keys(monthlyTotals).forEach(month => {
            monthlyAverages[month] = monthlyCounts[month] > 0 ? monthlyTotals[month] / monthlyCounts[month] : 0;
        });
        // Calculate growth rate (simplified)
        const months = Object.keys(monthlyTotals).sort();
        let growthRate = 0;
        if (months.length >= 2) {
            const firstMonth = monthlyTotals[months[0]];
            const lastMonth = monthlyTotals[months[months.length - 1]];
            growthRate = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;
        }
        const seasonalPatterns = Object.entries(monthlyAverages)
            .map(([month, average]) => ({ month, average }))
            .sort((a, b) => a.month.localeCompare(b.month));
        return {
            monthlyTotals,
            monthlyAverages,
            growthRate,
            seasonalPatterns
        };
    }
    generateInsights(expenses) {
        const categories = this.analyzeCategories(expenses);
        const vendors = this.analyzeVendors(expenses);
        const trends = this.calculateTrends(expenses);
        const topSpendingCategories = categories.topCategories
            .slice(0, 3)
            .map(c => c.category);
        const mostFrequentVendors = vendors.topVendors
            .slice(0, 3)
            .map(v => v.vendor);
        const spendingTrends = [];
        if (trends.growthRate > 10) {
            spendingTrends.push('Spending is increasing significantly');
        }
        else if (trends.growthRate < -10) {
            spendingTrends.push('Spending is decreasing significantly');
        }
        else {
            spendingTrends.push('Spending is relatively stable');
        }
        // Find unusual expenses (more than 2x average)
        const averageAmount = expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length;
        const unusualExpenses = expenses
            .filter(e => e.amount > averageAmount * 2)
            .slice(0, 5)
            .map(e => ({
            date: e.expense_date,
            vendor: e.vendor,
            amount: e.amount,
            reason: `High amount: ${e.amount} (${e.category})`
        }));
        return {
            topSpendingCategories,
            mostFrequentVendors,
            spendingTrends,
            unusualExpenses
        };
    }
    // Efficient targeted queries
    async getVendorAnalysis(userId, filters) {
        return this.analyzeExpenses(userId, filters).then(result => result.vendors);
    }
    async getCategoryAnalysis(userId, filters) {
        return this.analyzeExpenses(userId, filters).then(result => result.categories);
    }
    async getTrendAnalysis(userId, filters) {
        return this.analyzeExpenses(userId, filters).then(result => result.trends);
    }
    async getSummaryAnalysis(userId, filters) {
        return this.analyzeExpenses(userId, filters).then(result => result.summary);
    }
    // Empty state helpers
    getEmptySummary() {
        return {
            totalExpenses: 0,
            totalEntries: 0,
            totalQuantity: 0,
            averageAmount: 0,
            dateRange: { earliest: '', latest: '' }
        };
    }
    getEmptyCategoryAnalysis() {
        return {
            topCategories: [],
            categoryBreakdown: {}
        };
    }
    getEmptyVendorAnalysis() {
        return {
            topVendors: [],
            vendorBreakdown: {}
        };
    }
    getEmptyTrendAnalysis() {
        return {
            monthlyTotals: {},
            monthlyAverages: {},
            growthRate: 0,
            seasonalPatterns: []
        };
    }
    getEmptyInsights() {
        return {
            topSpendingCategories: [],
            mostFrequentVendors: [],
            spendingTrends: [],
            unusualExpenses: []
        };
    }
}
