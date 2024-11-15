'use client';

import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { getCardColor } from '@/services/get-card-color';
import { getFilledWordsArray } from '@/services/get-filled-words-array';
import { motion } from 'framer-motion';

export default function Home() {
    const roles: RoleEnum[] = [
        NoTeamEnum.NEUTRAL,
        NoTeamEnum.BLACK,
        TeamEnum.RED,
        TeamEnum.BLUE,
        TeamEnum.BLUE,
        TeamEnum.RED,
        NoTeamEnum.NEUTRAL,
        TeamEnum.RED,
        NoTeamEnum.NEUTRAL,
        TeamEnum.RED,
        NoTeamEnum.NEUTRAL,
        TeamEnum.BLUE,
        NoTeamEnum.NEUTRAL,
        TeamEnum.RED,
        NoTeamEnum.NEUTRAL,
        TeamEnum.RED,
        NoTeamEnum.NEUTRAL,
        NoTeamEnum.NEUTRAL,
        NoTeamEnum.NEUTRAL,
        TeamEnum.BLUE,
        TeamEnum.BLUE,
        NoTeamEnum.NEUTRAL,
        NoTeamEnum.NEUTRAL,
        TeamEnum.RED,
        TeamEnum.BLUE,
    ];
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="max-w-xl aspect-square w-[90%] h-[90%] grid grid-cols-5 grid-rows-5 gap-1 mx-auto">
                {getFilledWordsArray(0).map((_, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <div
                            className={ClassnameHelper.join(
                                getCardColor(roles[index]),
                                'w-full h-full shadow-none border-none rounded',
                            )}
                        ></div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
