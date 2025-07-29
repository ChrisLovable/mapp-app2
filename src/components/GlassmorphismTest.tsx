import React from 'react';

export default function GlassmorphismTest() {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/signupbackground.jpg') no-repeat center center / cover`,
        height: '100vh'
      }}
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Glassmorphism Test
          </h2>
          <p className="text-white/80">
            Beautiful frosted glass effect
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              First Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Last Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300"
              placeholder="Enter your last name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/60 transition-all duration-300"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
          >
            Continue
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            This is a test of the glassmorphism effect
          </p>
        </div>
      </div>
    </div>
  );
}