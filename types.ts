
export interface Document {
    id: string;
    name: string;
    content: string; // Text content for text files, or a placeholder for others
    file: File;      // The underlying file object
    url: string;     // Object URL for viewing/downloading
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
}
