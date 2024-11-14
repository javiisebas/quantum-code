import { motion } from 'framer-motion';
import { FC } from 'react';

interface SmokeEffectProps {
    visible: boolean;
    onComplete: () => void;
}

export const SmokeEffect: FC<SmokeEffectProps> = ({ visible, onComplete }) => {
    if (!visible) return null;

    return (
        <motion.div
            className="smoke-effect absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.5, 1, 0], scale: [0.5, 1.2, 1.5] }}
            transition={{ duration: 1, ease: 'easeOut' }}
            onAnimationComplete={onComplete}
        >
            <div className="w-24 h-24 bg-gray-400 rounded-full blur-sm opacity-75"></div>
            <div className="w-16 h-16 bg-gray-300 rounded-full blur opacity-50"></div>
        </motion.div>
    );
};
