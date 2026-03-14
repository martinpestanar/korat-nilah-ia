import { useState, useEffect } from 'react';

export interface AcademyNode {
    id: string;
    order: number;
    title: string;
    category: string;
    icon: any;
    color: {
        bg: string;
        ring: string;
        text: string;
        gradient: string;
    };
    content: {
        greeting: string;
        fact: string;
        action: string;
    };
}

export const useNilahAcademy = () => {
    const [unlockedNodes, setUnlockedNodes] = useState<string[]>(['node_1']);
    const [completedNodes, setCompletedNodes] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage
    useEffect(() => {
        const storedCompleted = localStorage.getItem('nilah_academy_completed');
        const storedUnlocked = localStorage.getItem('nilah_academy_unlocked');

        if (storedCompleted) {
            setCompletedNodes(JSON.parse(storedCompleted));
        }
        if (storedUnlocked) {
            setUnlockedNodes(JSON.parse(storedUnlocked));
        } else {
            // Default first node
            setUnlockedNodes(['node_1']);
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('nilah_academy_completed', JSON.stringify(completedNodes));
        localStorage.setItem('nilah_academy_unlocked', JSON.stringify(unlockedNodes));
    }, [completedNodes, unlockedNodes, isLoaded]);

    const completeNode = (nodeId: string, nextNodeId?: string) => {
        if (!completedNodes.includes(nodeId)) {
            setCompletedNodes((prev) => [...prev, nodeId]);
        }
        if (nextNodeId && !unlockedNodes.includes(nextNodeId)) {
            setUnlockedNodes((prev) => [...prev, nextNodeId]);
        }
    };

    const resetProgress = () => {
        setCompletedNodes([]);
        setUnlockedNodes(['node_1']);
    };

    return {
        unlockedNodes,
        completedNodes,
        completeNode,
        resetProgress,
        isLoaded
    };
};
