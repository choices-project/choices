'use client';

interface ShareButtonsProps {
  pollId: string;
  pollTitle: string;
}

export function ShareButtons({ pollId, pollTitle }: ShareButtonsProps) {
  const shareUrl = `${window.location.origin}/shared/poll/${pollId}`;
  const shareText = `Check out this poll: ${pollTitle}`;

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={shareToTwitter}
        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-400 text-white rounded text-sm hover:bg-blue-500 transition-colors"
      >
        <span>🐦</span>
        <span>Twitter</span>
      </button>
      <button
        onClick={shareToFacebook}
        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
      >
        <span>📘</span>
        <span>Facebook</span>
      </button>
      <button
        onClick={shareToLinkedIn}
        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-800 transition-colors"
      >
        <span>💼</span>
        <span>LinkedIn</span>
      </button>
      <button
        onClick={copyLink}
        className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
      >
        <span>📋</span>
        <span>Copy Link</span>
      </button>
    </div>
  );
}
