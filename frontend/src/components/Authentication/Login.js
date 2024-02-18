import React, { useState } from 'react'
import { Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, VStack, useToast} from '@chakra-ui/react'
import axios from "axios";
import {useHistory} from 'react-router-dom'

const Login = () => {
    const [show,setShow]=useState(false);
    const [email, setEmail]=useState();
    const [password,setpassword]=useState();
    const [loading,setLoading]=useState();

    const toast=useToast();
    const history=useHistory();

    const handleclick=()=>setShow(!show);
    const submitHandler = async () => {
        setLoading(true);
        if (!email || !password) {
          toast({
            title: "Please Fill all the Feilds",
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
          setLoading(false);
          return;
        }
    
        try {
          const config = {
            headers: {
              "Content-type": "application/json",
            },
          };
    
          const { data } = await axios.post(
            "http://localhost:5000/api/user/login",
            { email, password },
            config
          );
    
          toast({
            title: "Login Successful",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
          //setUser(data);
          localStorage.setItem("userInfo", JSON.stringify(data));
          setLoading(false);
          history.push("/chats");
        } catch (error) {
          toast({
            title: "Error Occured!",
            description: error.response.data.message,
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
          setLoading(false);
        }
      };

    return (
        <VStack spacing={"5px"} color={"black"}>
            <FormControl id="email" isRequired>
                <FormLabel>Email ID:</FormLabel>
                <Input
                placeholder='Enter Your Emain ID'
                value={email}
                onChange={(e)=>setEmail(e.target.value)}/>
            </FormControl>
            <FormControl id="password" isRequired>
                <FormLabel>Password:</FormLabel>
                <InputGroup>
                <Input
                placeholder='Enter Your Password'
                type={show? "text":'password'}
                value={password}
                onChange={(e)=>setpassword(e.target.value)}/>
                <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleclick}>
                        {show ? "Hide":"Show"}
                    </Button>
                </InputRightElement>
                </InputGroup>
            </FormControl>
            <Button colorScheme='blue'
            style={{marginTop:15}}
            onClick={submitHandler}
            isLoading={loading}>
                Login
            </Button>
            <Button colorScheme='blue'
            style={{marginTop:15}}
            onClick={()=>{
                setEmail("guest@example.com");
                setpassword("123456");
            }}
            >
                Get Guest User Credentials
            </Button>
        </VStack>
      )
}

export default Login