import { useCallback } from 'react';

interface ErrorToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  type?: 'error' | 'warning' | 'info';
}

interface ErrorToastReturn {
  showError: (title?: string, description?: string, options?: Partial<ErrorToastOptions>) => void;
  showWarning: (title?: string, description?: string, options?: Partial<ErrorToastOptions>) => void;
  showInfo: (title?: string, description?: string, options?: Partial<ErrorToastOptions>) => void;
}

export function useErrorToast(): ErrorToastReturn {
  const createToast = useCallback((options: ErrorToastOptions) => {
    const {
      title = 'Something went wrong',
      description = '',
      duration = 5000,
      type = 'error'
    } = options;

    // 🎨 Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // 🎨 Style based on type
    const styles = {
      error: 'bg-red-600 text-white border border-red-700',
      warning: 'bg-yellow-600 text-white border border-yellow-700',
      info: 'bg-blue-600 text-white border border-blue-700'
    };
    
    toast.className += ` ${styles[type]}`;
    
    // 🎨 Toast content
    toast.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          ${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-bold">${title}</h4>
          ${description ? `<p class="text-sm mt-1 opacity-90">${description}</p>` : ''}
        </div>
        <button class="flex-shrink-0 ml-2 text-white opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;
    
    // 🎨 Add to DOM
    document.body.appendChild(toast);
    
    // 🎨 Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 10);
    
    // 🎨 Auto remove
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duration);
    
    // 🎨 Click to dismiss
    toast.addEventListener('click', (e) => {
      if (e.target === toast) {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    });
  }, []);

  const showError = useCallback((title?: string, description?: string, options?: Partial<ErrorToastOptions>) => {
    createToast({
      title: title || 'Error',
      description,
      type: 'error',
      ...options
    });
  }, [createToast]);

  const showWarning = useCallback((title?: string, description?: string, options?: Partial<ErrorToastOptions>) => {
    createToast({
      title: title || 'Warning',
      description,
      type: 'warning',
      ...options
    });
  }, [createToast]);

  const showInfo = useCallback((title?: string, description?: string, options?: Partial<ErrorToastOptions>) => {
    createToast({
      title: title || 'Info',
      description,
      type: 'info',
      ...options
    });
  }, [createToast]);

  return {
    showError,
    showWarning,
    showInfo
  };
} 