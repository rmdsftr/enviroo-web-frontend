import React from "react";
import "../styles/tabs.css";

export interface TabOption {
    id: string;
    label: string;
}

interface TabsProps {
    tabs: TabOption[];
    activeTab: string;
    onChange: (id: string) => void;
    style?: React.CSSProperties;
    className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, style, className }) => {
    return (
        <div className={`tabs-container ${className || ""}`} style={style}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => onChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default Tabs;
