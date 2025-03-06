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
  Image,
  HStack,
  Spinner,
  Skeleton
} from '@chakra-ui/react';
import axios from 'axios';

// Configure axios
const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    'Content-Type': 'application/json'
  }
});

function WishList() {
  const [links, setLinks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productInfo, setProductInfo] = useState({});
  const toast = useToast();

  const extractInfoFromUrl = async (url) => {
    try {      
      let title = 'Produto sem título';
      let price = "R$0,00";
      let imageUrl = null;

      //title = await axios.get(`/api/scrape-title?url=${encodeURIComponent(url)}`);
      const imageResponse = await api.get(`/api/scrape-image?url=${encodeURIComponent(url)}`);
      imageUrl = imageResponse.data.imageUrl;
      //price = await axios.get(`/api/scrape-price?url=${encodeURIComponent(url)}`);
      return { title, price, imageUrl };
    } catch (err) {
      console.error('Error fetching product info:', err);
      return { title: 'erro', price: "R$1,00", imageUrl: null };
    }
  };

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        // Replace with actual user ID when authentication is implemented
        const sender = 'test-user';
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
          title: 'Erro',
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
  }, [toast]);

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
                <Box position="relative" width="150px" height="150px">
                  <Image
                    src={productInfo[link]?.imageUrl}
                    alt={productInfo[link]?.title}
                    objectFit="cover"
                    borderRadius="md"
                    fallback={
                      <Skeleton width="150px" height="150px" borderRadius="md" />
                    }
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
                        {productInfo[link].price}
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