'use client';

import { RoleEnum } from '@/enum/role.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { getCardColor } from '@/services/get-card-color';
import { motion } from 'framer-motion';
import { FC } from 'react';
import { SpyBoardFrame } from './SpyBoardFrame';

interface SpyBoardProps {
    roles: RoleEnum[];
}

export const SpyBoard: FC<SpyBoardProps> = ({ roles }) => {
    return (
        <SpyBoardFrame>
            <div className="max-w-xl aspect-square w-[90%] h-[90%] rounded-xl bg-gray-400/50 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 shadow-2xl shadow-gray-200/10">
                <div className="bg-gray-900 w-full h-full p-2 rounded-lg">
                    <div className="grid grid-cols-5 grid-rows-5 gap-2 mx-auto w-full h-full">
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
                                        'w-full h-full shadow-none border-2 rounded-lg',
                                    )}
                                ></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </SpyBoardFrame>
    );
};
