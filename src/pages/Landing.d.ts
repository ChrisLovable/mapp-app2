import React from 'react';
import './Landing.css';
interface LandingProps {
    onSelectPlan: (plan: 'free' | 'paid') => void;
}
declare const Landing: React.FC<LandingProps>;
export default Landing;
