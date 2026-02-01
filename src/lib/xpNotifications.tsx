import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

/**
 * Show XP notification when XP is earned or deducted
 * @param amount - Amount of XP (positive for earned, negative for deducted)
 * @param reason - Reason for XP change (e.g., "Challenge Completed", "Late Submission")
 * @param isWeekly - Whether this affects weekly XP
 */
export function showXPNotification(amount: number, reason?: string, isWeekly: boolean = true) {
    const isPositive = amount > 0;
    const absAmount = Math.abs(amount);

    if (isPositive) {
        toast.success(
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-green-900">+{absAmount} XP Earned!</p>
                    {reason && <p className="text-sm text-green-700">{reason}</p>}
                    {isWeekly && <p className="text-xs text-green-600 mt-0.5">Added to weekly leaderboard</p>}
                </div>
            </div>,
            {
                duration: 4000,
                className: 'bg-green-50 border-green-200',
            }
        );
    } else {
        toast.error(
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-red-900">-{absAmount} XP Deducted</p>
                    {reason && <p className="text-sm text-red-700">{reason}</p>}
                    {isWeekly && <p className="text-xs text-red-600 mt-0.5">Removed from weekly XP</p>}
                </div>
            </div>,
            {
                duration: 4000,
                className: 'bg-red-50 border-red-200',
            }
        );
    }
}

/**
 * Show level up notification
 */
export function showLevelUpNotification(newLevel: number) {
    toast.success(
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center animate-pulse">
                <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
                <p className="font-black text-lg text-yellow-900">Level Up!</p>
                <p className="text-sm font-bold text-yellow-700">You reached Level {newLevel}</p>
            </div>
        </div>,
        {
            duration: 6000,
            className: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 shadow-lg',
        }
    );
}

/**
 * Show badge earned notification
 */
export function showBadgeEarnedNotification(badgeName: string, icon?: string) {
    toast.success(
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-2xl">
                {icon || '🏆'}
            </div>
            <div className="flex-1">
                <p className="font-black text-purple-900">Badge Earned!</p>
                <p className="text-sm font-bold text-purple-700">{badgeName}</p>
            </div>
        </div>,
        {
            duration: 6000,
            className: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 shadow-lg',
        }
    );
}
