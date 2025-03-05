import { useState, useEffect } from 'react';
import {
  VStack,
  Heading,
  List,
  ListItem,
  Link,
  Text,
  Box,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';

function WishList() {
  const [links, setLinks] = useState([]);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        // Replace with actual user ID when authentication is implemented
        const userId = 'test-user';
        const response = await axios.get(`/api/links/${userId}`);
        setLinks(response.data);
      } catch (err) {
        setError('Falha ao carregar lista de desejos');
        toast({
          title: 'Erro',
          description: 'Falha ao carregar lista de desejos',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchLinks();
  }, [toast]);

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading as="h1" size="xl" textAlign="center">
        KEROZAP - lista de desejos
      </Heading>
      
      {links.length === 0 ? (
        <Text textAlign="center">Nenhum item na sua lista de desejos ainda</Text>
      ) : (
        <List spacing={3}>
          {links.map((link, index) => (
            <ListItem
              key={index}
              p={4}
              bg="white"
              borderRadius="md"
              boxShadow="sm"
              _hover={{ boxShadow: 'md' }}
            >
              <Link href={link} isExternal color="blue.500">
                {link}
              </Link>
            </ListItem>
          ))}
        </List>
      )}
    </VStack>
  );
}

export default WishList; 