import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Home() {
  const [query, setQuery] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([
    { message: 'Hi 🍂', type: 'apiMessage' },
  ]);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!query || !visitorId) {
      alert('Please input a question and visitor ID');
      return;
    }

    const question = query.trim();

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'userMessage', message: question },
    ]);
    setLoading(true);
    setQuery('');

    try {
      const startTime = Date.now();
      const response = await fetch('http://34.100.143.11:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': 'qwertyuiop',
        },
        body: JSON.stringify({ question, visitorId }),
      });
      const endTime = Date.now();
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            type: 'apiMessage',
            message: data.text,
            responseTime: endTime - startTime,
          },
        ]);
      }

      setLoading(false);
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  const handleEnter = (e) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <Layout>
      <div className="mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
          AI Assistant 👀
        </h1>
        <main className={styles.main}>
          <div className={styles.cloud}>
            <div ref={messageListRef} className={styles.messagelist}>
              {messages.map((message, index) => {
                const isApiMessage = message.type === 'apiMessage';
                const icon = (
                  <Image
                    key={index}
                    src={isApiMessage ? '/bot-image.png' : '/usericon.png'}
                    alt={isApiMessage ? 'AI' : 'Me'}
                    width={isApiMessage ? 40 : 30}
                    height={isApiMessage ? 40 : 30}
                    className={isApiMessage ? styles.boticon : styles.usericon}
                    priority
                  />
                );
                const className = isApiMessage
                  ? styles.apimessage
                  : loading && index === messages.length - 1
                    ? styles.usermessagewaiting
                    : styles.usermessage;

                return (
                  <>
                    <div key={`chatMessage-${index}`} className={className}>
                      {icon}
                      <div className={styles.markdownanswer}>
                        <ReactMarkdown linkTarget="_blank">
                          {message.message}
                        </ReactMarkdown>
                      </div>
                    </div>
                    {message.responseTime && (
                      <div className="p-5">
                        <Accordion type="single" collapsible className="flex-col">
                          <div>
                            <AccordionItem value={`item-${index}`}>
                              <AccordionTrigger>
                                <h3>Response Time</h3>
                              </AccordionTrigger>
                              <AccordionContent>
                                <p>Time: {message.responseTime}ms</p>
                              </AccordionContent>
                            </AccordionItem>
                          </div>
                        </Accordion>
                      </div>
                    )}
                  </>
                );
              })}
            </div>
          </div>
          <div className={styles.center}>
            <div className={styles.cloudform}>
              <textarea
                disabled={loading}
                value={visitorId}
                onChange={(e) => setVisitorId(e.target.value)}
                placeholder="Visitor ID"
                rows={1}
                className={styles.textarea}
              />
              <form onSubmit={handleSubmit}>
                <textarea
                  disabled={loading}
                  onKeyDown={handleEnter}
                  ref={textAreaRef}
                  autoFocus={false}
                  rows={1}
                  maxLength={512}
                  id="userInput"
                  name="userInput"
                  placeholder={loading ? 'Waiting for response...' : 'Ask me 🏯'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={styles.textarea}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.generatebutton}
                >
                  {loading ? (
                    <div className={styles.loadingwheel}>
                      <LoadingDots color="#000" />
                    </div>
                  ) : (
                    <svg
                      viewBox="0 0 20 20"
                      className={styles.svgicon}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
          {error && (
            <div className="border border-red-400 rounded-md p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
