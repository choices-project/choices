// Example usage of MessageThread
import { MessageThread } from '@/components/business';

export default function ContactPage({ params }: { params: { id: string } }) {
  return (
    <MessageThread
      threadId={params.id}
      currentUserId="user-123"
      representative={{
        id: "rep-456",
        name: "John Doe",
        office: "Senator",
        party: "Independent"
      }}
    />
  );
}