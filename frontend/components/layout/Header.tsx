"use client";

import { Book } from "lucide-react";

export const Header = () => {

    return (
        <header
            className="flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200/70 shadow-2xs z-50 transition-all duration-300"
            style={{ height: "52px" }}>
            <div className="flex items-center gap-2">
                <div className="flex items-center">
                    <div className="flex gap-2 pl-4 items-center w-[224px] h-[52px]">
                        {/* ロゴ部分 */}
                        <div className="flex items-center gap-2 ml-2">
                            <div className="w-7 h-7 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Book className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-base font-semibold text-gray-800">Academic Reader</span>
                        </div>
                    </div>

                </div>
            </div>

        </header>
    );
};
