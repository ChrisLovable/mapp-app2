// Device detection utility for Gabby (Phone-only PWA)

export const deviceDetection = {
  isPhone(): boolean {
    // Improved phone detection (excluding tablets)
    const userAgent = navigator.userAgent.toLowerCase();
    // Covers most Android/iOS/modern mobile browsers
    const isMobileDevice = /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile|sm-g|sm-a|sm-n|pixel|oneplus|huawei|xiaomi|redmi|moto|nokia|sony|htc|lg|samsung|vivo|oppo|realme|lenovo|zte|meizu|asus|alcatel|micromax|infinix|tecno|lava|gionee|leeco|panasonic|coolpad|bluboo|doogee|ulefone|oukitel|cubot|wiko|bq|fairphone|catphone|crosscall|energizer|hisense|sharp|tcl|umidigi|vernee|wileyfox|yota|zte|zte/i.test(userAgent);
    // Exclude tablets (iPad, Android tablets, etc.)
    const isTablet = /ipad|tablet|nexus 7|nexus 9|sm-t|gt-p|lenovo tab|tab/i.test(userAgent) || 
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh|windows/i.test(userAgent));
    const result = isMobileDevice && !isTablet;
    // Debug log
    console.log('[Gabby DeviceDetection] userAgent:', userAgent);
    console.log('[Gabby DeviceDetection] isMobileDevice:', isMobileDevice, 'isTablet:', isTablet, '=> isPhone:', result);
    return result;
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
