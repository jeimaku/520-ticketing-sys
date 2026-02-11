// src/components/AutomationMessages.js

export const AUTOMATION_CONFIG = {
  // Delay before showing automated welcome message (in milliseconds)
  WELCOME_DELAY: 3 * 60 * 1000, // 3 minutes
  
  // Bot/Assistant identity
  BOT_NAME: 'Automated Assistant',
  BOT_TYPE: 'admin' // Messages count as admin type
}

// Predefined message templates
export const AUTOMATION_MESSAGES = {
  // Welcome message that appears after delay
  welcome: (companyName, ticketId) => 
    `Hello there, ${companyName || 'Client'} client! Thank you for your patience. All our support agents are currently assisting other clients, but your ticket #${ticketId.slice(0, 8)} is in our queue. While you wait, would you like to get immediate details about your submission or try our quick-resolve tools? Please select an option below.`,

  // Quick action options for clients
  quickActions: [
    {
      id: 'timeline',
      label: 'When will my issue be resolved?',
      question: 'When will my issue be resolved?',
      answer: {
        type: 'structured',
        content: {
          priority: 'Standard Priority',
          estimatedResponse: 'Within 4 hours',
          estimatedResolution: '24–48 hours',
          urgentNote: {
            title: 'URGENT NOTE:',
            text: 'Before you restart your PC or close this website, make sure to copy the link of your ticket so that you will be able to access and monitor the status of your ticket. If this issue is preventing you from working entirely (e.g., system lockout), please reply with \'URGENT\' to flag this for a supervisor.'
          }
        }
      }
    },
    {
      id: 'selfhelp',
      label: 'Is there anything I can do right now?',
      question: 'Is there anything I can do right now?',
      answer: {
        type: 'categorized',
        content: {
          intro: 'Yes, here is a categorized guide for common issues:',
          categories: [
            {
              icon: '🌐',
              title: 'Network & Connectivity',
              items: [
                { label: 'WiFi/Ethernet:', solution: 'Disconnect and reconnect your internet source.' },
                { label: 'VPN:', solution: 'If enabled, try toggling it off and on.' },
                { label: 'Slowness:', solution: 'Close high-bandwidth tabs (Video/Streaming).' }
              ]
            },
            {
              icon: '💻',
              title: 'Hardware & System',
              items: [
                { label: 'Restart:', solution: 'A full system restart resolves 40% of glitches.' },
                { label: 'Cables:', solution: 'Ensure power and monitor cables are tight.' }
              ]
            },
            {
              icon: '🔐',
              title: 'Access & Accounts',
              items: [
                { label: 'Login:', solution: 'Check Caps Lock or clear browser cache.' }
              ]
            }
          ],
          followup: 'Did this help? If yes, you can reply \'Close Ticket\'.'
        }
      }
    },
    {
      id: 'information',
      label: 'Did I provide enough information?',
      question: 'Did I provide enough information?',
      answer: {
        type: 'checklist',
        content: {
          intro: 'We have received your initial report. To speed up the resolution process once an agent connects, please ensure you have provided:',
          items: [
            'Asset Tag Number: (Found on the bottom or back of your device).',
            'Screenshots: Images of the error message.',
            'Reproduction Steps: What were you doing when the error occurred?'
          ],
          outro: 'You can upload files or type these details here in the chat while you wait.'
        }
      }
    },
    {
      id: 'process',
      label: 'What is the process for this type of issue?',
      question: 'What is the process for this type of issue?',
      answer: {
        type: 'timeline',
        content: {
          intro: 'Here is the lifecycle for your ticket:',
          steps: [
            { 
              number: 1, 
              title: 'Triage (Current Stage)', 
              description: 'An admin reviews the issue to assign the correct specialist.' 
            },
            { 
              number: 2, 
              title: 'Investigation', 
              description: 'A specialist will contact you or remotely access your machine.' 
            },
            { 
              number: 3, 
              title: 'Resolution & Testing', 
              description: 'We fix the issue and verify it with you.' 
            },
            { 
              number: 4, 
              title: 'Closure', 
              description: 'You will receive a summary email and a satisfaction survey.' 
            }
          ]
        }
      }
    }
  ]
}

// Function to format structured answers into readable text
export const formatAutomationAnswer = (answer) => {
  if (typeof answer === 'string') {
    return answer
  }

  if (!answer || !answer.type || !answer.content) {
    return 'Sorry, I couldn\'t format this response properly.'
  }

  switch (answer.type) {
    case 'structured':
      return formatStructuredAnswer(answer.content)
    case 'categorized':
      return formatCategorizedAnswer(answer.content)
    case 'checklist':
      return formatChecklistAnswer(answer.content)
    case 'timeline':
      return formatTimelineAnswer(answer.content)
    default:
      return 'Unknown answer format.'
  }
}

// Individual formatting functions
const formatStructuredAnswer = (content) => {
  let text = `Your ticket is currently categorized as ${content.priority}.\n\n`
  text += `Estimated Response Time: ${content.estimatedResponse}.\n`
  text += `Estimated Resolution Time: ${content.estimatedResolution}.\n\n`
  
  if (content.urgentNote) {
    text += `**${content.urgentNote.title}** ${content.urgentNote.text}`
  }
  
  return text
}

const formatCategorizedAnswer = (content) => {
  let text = content.intro + '\n\n'
  
  content.categories.forEach(category => {
    text += `${category.icon} **${category.title}**\n`
    category.items.forEach(item => {
      text += `- **${item.label}** ${item.solution}\n`
    })
    text += '\n'
  })
  
  text += content.followup
  return text
}

const formatChecklistAnswer = (content) => {
  let text = content.intro + '\n\n'
  
  content.items.forEach(item => {
    text += `- ${item}\n`
  })
  
  text += `\n${content.outro}`
  return text
}

const formatTimelineAnswer = (content) => {
  let text = content.intro + '\n\n'
  
  content.steps.forEach(step => {
    text += `${step.number}. **${step.title}**: ${step.description}\n`
  })
  
  return text
}

// Utility function to convert markdown-style formatting to display text
export const convertMarkdownToText = (text) => {
  // Convert **bold** to actual formatting (for display purposes)
  // Note: This returns plain text but indicates emphasis through structure
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold markers
    .replace(/\n/g, '\n') // Preserve line breaks
}

// Function to check if a message contains structured formatting
export const hasStructuredFormatting = (message) => {
  return message.includes('**') || message.includes('\n\n')
}

// Function to parse and render structured messages
export const parseStructuredMessage = (message) => {
  if (!hasStructuredFormatting(message)) {
    return [{ type: 'text', content: message }]
  }

  const parts = []
  const lines = message.split('\n')
  
  lines.forEach(line => {
    if (line.includes('**')) {
      // Parse bold formatting
      const segments = line.split(/(\*\*.*?\*\*)/)
      segments.forEach(segment => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          parts.push({ 
            type: 'bold', 
            content: segment.slice(2, -2) 
          })
        } else if (segment.trim()) {
          parts.push({ 
            type: 'text', 
            content: segment 
          })
        }
      })
      parts.push({ type: 'break' })
    } else if (line.trim()) {
      parts.push({ 
        type: 'text', 
        content: line 
      })
      parts.push({ type: 'break' })
    } else {
      parts.push({ type: 'paragraph' })
    }
  })
  
  return parts
}