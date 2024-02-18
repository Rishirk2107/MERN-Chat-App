import React from "react";
import { Container, Box, Text } from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

const Homepage = () => {
    return (
    <Container maxW={"xl"} centerContent>
        <Box
        d='flex'
        justifyContent='center'
        p={3}
        bg={"white"}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="1g"
        borderWidth="1px">
            <Text fontSize={"4xl"} fontFamily={"Work Sans"} textAlign={"center"}>Chat App</Text>
        </Box>
        <Box bg="white" w="100%" p={4} borderRadius="1g" color={"black"} borderWidth="1px">
        <Tabs size='md' variant='enclosed'>
  <TabList>
    <Tab width={"50%"}>Login</Tab>
    <Tab width={"50%"}>Sign Up</Tab>
  </TabList>

  <TabPanels>
    <TabPanel>
      <Login/>
    </TabPanel>
    <TabPanel>
      <Signup/>
    </TabPanel>
  </TabPanels>
</Tabs>
        </Box>
    </Container>
    )
}

export default Homepage