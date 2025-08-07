// Device detection utility for Gabby (Phone-only PWA)

export const deviceDetection = {
  isPhone(): boolean {
    // Detect phones specifically (excluding tablets)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|tablet/i.test(userAgent) || 
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/i.test(userAgent));
    
    return isMobileDevice && !isTablet;
  },

  enforcePhoneOnly(): void {
    if (!this.isPhone()) {
      const message = `
        <div style="text-align: center; padding: 20px; font-family: sans-serif;">
          <h2>📱 Phone Only App</h2>
          <p>Gabby is designed exclusively for mobile phones.</p>
          <p>Please access this app from your phone.</p>
          <small>This is not supported on tablets or computers.</small>
        </div>
      `;
      document.body.innerHTML = message;
      document.body.style.backgroundColor = '#f5f5f5';
    }
  },

  getDeviceInfo(): {
    isPhone: boolean;
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
  } {
    return {
      isPhone: this.isPhone(),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio
    };
  }
};
