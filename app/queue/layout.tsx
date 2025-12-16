import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Fila de Atendimento',
};

export default function QueueLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
