export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any> | {
    auth: {
        getSession: () => Promise<{
            data: {
                session: null;
            };
            error: null;
        }>;
        onAuthStateChange: () => {
            data: {
                subscription: {
                    unsubscribe: () => void;
                };
            };
        };
        signOut: () => Promise<{
            error: null;
        }>;
        signInWithPassword: () => Promise<{
            data: null;
            error: Error;
        }>;
        signUp: () => Promise<{
            data: null;
            error: Error;
        }>;
        resetPasswordForEmail: () => Promise<{
            error: Error;
        }>;
        updateUser: () => Promise<{
            data: null;
            error: Error;
        }>;
        getUser: () => Promise<{
            data: {
                user: null;
            };
            error: null;
        }>;
    };
    from: (table: string) => {
        data: never[];
        error: Error;
        select: () => /*elided*/ any;
        insert: () => /*elided*/ any;
        update: () => /*elided*/ any;
        delete: () => /*elided*/ any;
        upsert: () => /*elided*/ any;
        eq: () => /*elided*/ any;
        order: () => /*elided*/ any;
        limit: () => /*elided*/ any;
        single: () => /*elided*/ any;
    };
    storage: {
        from: (bucket: string) => {
            upload: () => Promise<{
                data: null;
                error: Error;
            }>;
            getPublicUrl: () => {
                data: {
                    publicUrl: string;
                };
            };
            remove: () => Promise<{
                data: null;
                error: Error;
            }>;
        };
    };
};
export declare const isSupabaseAvailable: any;
