console.log('MUD Server starting...');

export const startServer = () => {
  console.log('Starting MUD server on port 3000');
  // TODO: Implement server logic
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
