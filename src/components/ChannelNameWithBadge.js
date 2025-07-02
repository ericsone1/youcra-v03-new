import React from 'react';
import { checkYouTubeSubscription } from '../utils/youtubeAuth';

// props: channelId, channelName
export default function ChannelNameWithBadge({ channelId, channelName }) {
  const [isSubscribed, setIsSubscribed] = React.useState(null);

  React.useEffect(() => {
    if (channelId) {
      checkYouTubeSubscription(channelId).then(setIsSubscribed);
    }
  }, [channelId]);

  return (
    <span className="flex items-center gap-2">
      <span className="font-bold">{channelName}</span>
      {isSubscribed === true && (
        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold">구독자</span>
      )}
      {isSubscribed === false && (
        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-semibold">미구독자</span>
      )}
    </span>
  );
} 