import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { iconPaths } from "../IconPaths";

interface Skill {
    title: string;
    icon: keyof typeof iconPaths;
    items: string[];
    color: string;
}

interface SkillsProps {
    skillsData?: Skill[];
}

const defaultSkillsData: Skill[] = [
    {
        title: "Design",
        icon: "pencil-line",
        items: ["Photoshop", "Canva", "Figma"],
        color: "from-purple-500 to-indigo-500"
    },
    {
        title: "Front-end",
        icon: "code",
        items: ["Expo", "Next.js", "Tailwind CSS", "TypeScript"],
        color: "from-blue-500 to-cyan-500"
    },
    {
        title: "Back-end",
        icon: "terminal-window",
        items: ["PHP (Laravel)", "Python", "Adonis js"],
        color: "from-emerald-500 to-teal-500"
    },
    {
        title: "Other",
        icon: "github-logo",
        items: ["Git & GitHub", "Ubuntu", "Reduce ToolKit"],
        color: "from-orange-500 to-red-500"
    },
];

const SpotlightCard: React.FC<{ skill: Skill; index: number }> = ({ skill, index }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onMouseMove={handleMouseMove}
            className="group relative h-full backdrop-blur-md bg-gray-500/5 dark:bg-white/5 rounded-3xl border border-gray-200/20 dark:border-white/10 overflow-hidden transition-all duration-500 hover:border-purple-500/30 hover:shadow-xl"
        >
            {/* Spotlight Effect */}
            <div
                className="pointer-events-none absolute -inset-px transition duration-300 opacity-0 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.1), transparent 40%)`,
                }}
            />

            <div className="px-8 py-10 relative z-10 flex flex-col h-full">
                <div className="flex items-center mb-8">
                    <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-tr ${skill.color} blur-xl opacity-10 group-hover:opacity-30 transition-opacity duration-500`} />
                        <div className="relative p-4 bg-gray-100/10 dark:bg-gray-800/80 rounded-2xl border border-gray-200/20 dark:border-white/5 mr-4 shadow-inner">
                            <Icon 
                                icon={skill.icon} 
                                size="2.5rem" 
                                gradient 
                            />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[var(--gray-0)] transition-all duration-300">
                            {skill.title}
                        </h3>
                        <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${skill.color} transition-all duration-500 rounded-full mt-1`} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                    {skill.items.map((item, idx) => (
                        <motion.span
                            key={idx}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="px-4 py-2 text-sm font-medium text-[var(--gray-200)] bg-gray-500/5 dark:bg-white/5 border border-gray-200/20 dark:border-white/10 rounded-xl hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-300 transition-all duration-300 backdrop-blur-sm"
                        >
                            {item}
                        </motion.span>
                    ))}
                </div>
            </div>

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('/assets/backgrounds/noise.png')]" />
        </motion.div>
    );
};

const Skills: React.FC<SkillsProps> = ({ skillsData = defaultSkillsData }) => {
    return (
        <section id="skills" className="relative py-24 px-6 md:px-12 overflow-hidden bg-transparent">
            {/* Background Ambient Decor - Subtler orbs for light mode */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50 dark:opacity-100">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow [animation-delay:2s]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-20">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                            <span className="text-[var(--gray-0)]">Professional</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
                                Mastery & Tools
                            </span>
                        </h2>
                        <p className="text-[var(--gray-300)] text-xl max-w-3xl mx-auto font-light leading-relaxed">
                            Crafting digital excellence through a sophisticated stack of modern technologies and creative design tools.
                        </p>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-px w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mt-8"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {skillsData.map((skill, index) => (
                        <SpotlightCard key={index} skill={skill} index={index} />
                    ))}
                </div>
                
                {/* Bottom decorative element */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1 }}
                    className="mt-20 flex justify-center"
                >
                    <div className="px-6 py-3 rounded-full border border-gray-200/20 dark:border-white/5 bg-gray-500/5 dark:bg-white/5 backdrop-blur-md text-[var(--gray-400)] text-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Always evolving and learning new technologies
                    </div>
                </motion.div>
            </div>

            <style>
                {`
                    @keyframes pulse-slow {
                        0%, 100% { opacity: 0.4; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(1.1); }
                    }
                    .animate-pulse-slow {
                        animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                `}
            </style>
        </section>
    );
};

export default Skills;
