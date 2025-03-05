import { ChakraProvider, Box, Container } from '@chakra-ui/react';
import WishList from './components/WishList';

function App() {
  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        <Container maxW="container.lg" py={8}>
          <WishList />
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App; 