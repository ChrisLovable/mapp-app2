export declare const deviceDetection: {
    isPhone(): boolean;
    enforcePhoneOnly(): void;
    getDeviceInfo(): {
        isPhone: boolean;
        userAgent: string;
        screenWidth: number;
        screenHeight: number;
        devicePixelRatio: number;
    };
};
