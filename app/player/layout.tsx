import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Player TV',
};

export default function PlayerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
