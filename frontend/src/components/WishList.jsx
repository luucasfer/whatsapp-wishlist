import { useState, useEffect } from 'react';
import {
  VStack,
  Heading,
  List,
  ListItem,
  Link,
  Text,
  Box,
  useToast,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import axios from 'axios';

// Configure axios
const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    'Content-Type': 'application/json',
  },
});

function WishList() {
  // Extract the sender from the last part of the URL
  const sender = window.location.pathname.split('/').pop();

  const [links, setLinks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productInfo, setProductInfo] = useState({});
  const toast = useToast();

  const extractInfoFromUrl = async (url) => {
    try {
      const response = await api.get(`/api/scrape-data?url=${encodeURIComponent(url)}`);
      const { title, price, imageUrl } = response.data;
      return { title, price, imageUrl };
    } catch (err) {
      console.error('[Wishlist][extractInfoUrl] - ', err);
      return { title: 'Titulo não encontrado', price: "R$ 0,00", imageUrl: null };
    }
  };

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await api.get(`/links/${sender}`);
        setLinks(response.data);

        // Extract info from URLs
        const info = {};
        for (const link of response.data) {
          info[link] = await extractInfoFromUrl(link);
        }
        setProductInfo(info);
      } catch (err) {
        setError('Falha ao carregar lista de desejos');
        toast({
          title: 'Erro inesperado',
          description: 'Falha ao carregar lista de desejos',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [sender, toast]);

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          KEROZAP - Lista de Desejos
        </Heading>
        <Box textAlign="center">
          <Spinner size="xl" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading as="h1" size="xl" textAlign="center">
        KEROZAP - Lista de Desejos
      </Heading>

      {links.length === 0 ? (
        <Text textAlign="center">Nenhum item na sua lista de desejos ainda</Text>
      ) : (
        <List spacing={4}>
          {links.map((link, index) => (
            <ListItem
              key={index}
              p={4}
              bg="white"
              borderRadius="md"
              boxShadow="sm"
              _hover={{ boxShadow: 'md' }}
            >
              <HStack spacing={4} align="center">
                <Box position="relative" width="180px" height="200px">
                  <img
                    src={productInfo[link]?.imageUrl || 'https://via.placeholder.com/180x200'}
                    alt={productInfo[link]?.title}
                    style={{ objectFit: 'cover', borderRadius: '0.375rem', width: '100%', height: '100%' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/180x200'; // Fallback image
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <VStack align="start" spacing={1}>
                    <Link
                      href={link}
                      isExternal
                      color="blue.500"
                      fontSize="lg"
                      fontWeight="medium"
                      _hover={{ textDecoration: 'none', color: 'blue.600' }}
                    >
                      {productInfo[link]?.title}
                    </Link>
                    {productInfo[link]?.price && (
                      <Text color="green.600" fontWeight="bold">
                        {`${productInfo[link].price}`}
                      </Text>
                    )}
                  </VStack>
                </Box>
              </HStack>
            </ListItem>
          ))}
        </List>
      )}
    </VStack>
  );
}

export default WishList;