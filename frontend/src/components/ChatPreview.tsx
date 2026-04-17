import './ChatPreview.css'

interface ChatUser {
  name: string
  influenceLevel: number
  message: string
}

const ChatPreview = () => {
  const chatUsers: ChatUser[] = [
    {
      name: 'Rahul',
      influenceLevel: 82,
      message: 'FD is best for stability'
    },
    {
      name: 'Sneha',
      influenceLevel: 65,
      message: 'Mutual funds for long-term growth'
    },
    {
      name: 'Aman',
      influenceLevel: 20,
      message: 'Crypto is risky but rewarding'
    }
  ]

  return (
    <div className="chat-preview-section">
      <h3 className="chat-title">💬 Financial Discussions</h3>
      <div className="chat-messages">
        {chatUsers.map((user, index) => (
          <div
            key={index}
            className={`chat-message ${user.influenceLevel >= 60 ? 'high-influence' : ''}`}
          >
            <div className="chat-user-header">
              <span className={`chat-username ${user.influenceLevel >= 60 ? 'bold' : ''}`}>
                {user.name}
              </span>
              <span className="chat-influence">⭐ {user.influenceLevel}</span>
            </div>
            <p className="chat-text">{user.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatPreview
