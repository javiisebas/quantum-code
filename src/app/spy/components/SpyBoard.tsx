'use client';

import { RoleEnum } from '@/enum/role.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { getCardColor } from '@/services/get-card-color';
import { motion } from 'framer-motion';
import { FC } from 'react';

interface SpyBoardProps {
    roles: RoleEnum[];
}

export const SpyBoard: FC<SpyBoardProps> = ({ roles }) => {
    return (
        <div className="max-w-xl aspect-square w-[90%] h-[90%] grid grid-cols-5 grid-rows-5 gap-1 mx-auto">
            {roles.map((role, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                    <div
                        className={ClassnameHelper.join(
                            getCardColor(role),
                            'w-full h-full shadow-none border-2 rounded',
                        )}
                    ></div>
                </motion.div>
            ))}
        </div>
    );
};
