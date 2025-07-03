# Customer UI - Loyalty Platform

A modern, responsive customer interface for the Multi-Business Loyalty Platform with an integrated LLM-powered chat assistant.

## Features

### 🎯 Core Features
- **Points Balance Check**: Simple phone number lookup to check loyalty points
- **Transaction History**: View recent earning and redemption transactions
- **Personalized Recommendations**: AI-driven suggestions based on customer behavior
- **Real-time Stats**: Visual display of points earned vs redeemed

### 🤖 LLM-Powered Chat Assistant
- **Conversational Interface**: Natural language queries about loyalty program
- **Context-Aware Responses**: Understands and responds to various loyalty-related questions
- **Multi-topic Support**: 
  - Points balance inquiries
  - Transaction history
  - Recommendations
  - Referral program information
  - General help and guidance

### 💫 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Gradient Backgrounds**: Beautiful purple-blue gradient theme
- **Glass Effects**: Modern glassmorphism design elements
- **Smooth Animations**: Fade-in effects and smooth transitions
- **Intuitive Icons**: FontAwesome icons for better user experience

## Chat Assistant Capabilities

The AI assistant can handle various types of queries:

### Points-Related Queries
- "How many points do I have?"
- "What's my current balance?"
- "Check my points for +1234567890"

### Transaction Queries
- "Show my recent transactions"
- "What's my transaction history?"
- "When did I last earn points?"

### Recommendations
- "Any recommendations for me?"
- "What should I do with my points?"
- "Are there any offers available?"

### Referral Information
- "How do referrals work?"
- "How can I refer friends?"
- "What are the referral benefits?"

### General Help
- "What can you do?"
- "Help me"
- "How does this work?"

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd customer-ui
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the UI**:
   - Open your browser to `http://localhost:3000`
   - Make sure your FastAPI backend is running on `http://localhost:8000`

## API Integration

The customer UI integrates with the following backend endpoints:

- `GET /customers/points/{phone_number}` - Get customer points and transactions
- `GET /customers/recommendations/{phone_number}` - Get personalized recommendations

## Configuration

### API URL
Update the `apiUrl` in `app.js` to match your backend URL:
```javascript
this.apiUrl = 'http://localhost:8000'; // Update as needed
```

### Styling
The UI uses Tailwind CSS via CDN. Custom styles are defined in the `<style>` section of `index.html`.

## File Structure

```
customer-ui/
├── index.html          # Main HTML file with UI structure
├── app.js             # JavaScript application logic
├── server.js          # Express server for serving static files
├── package.json       # Node.js dependencies
└── README.md         # This file
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with modern JavaScript support

## Development

### Adding New Chat Features
To add new chat capabilities:

1. Update the `processLLMQuery` method in `app.js`
2. Add new query handlers following the existing pattern
3. Test with various natural language inputs

### Customizing the UI
- Colors: Modify the gradient classes in `index.html`
- Layout: Update the grid structure and responsive classes
- Animations: Adjust the CSS animations in the `<style>` section

## Troubleshooting

### Common Issues

1. **Chat not working**: Check console for JavaScript errors
2. **Points not loading**: Verify backend API is running and accessible
3. **Styling issues**: Ensure Tailwind CSS CDN is loading properly

### API Errors
- **404 errors**: Check that the backend endpoints exist
- **CORS errors**: Ensure backend has proper CORS configuration
- **Network errors**: Verify API URL is correct

## Future Enhancements

- [ ] Voice input for chat queries
- [ ] Push notifications for new recommendations
- [ ] Offline mode with local storage
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with actual LLM APIs (OpenAI, Anthropic, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see the main project for details.
