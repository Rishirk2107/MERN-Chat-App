

import React, { useState } from 'react'
import { Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, VStack, useToast } from '@chakra-ui/react'
import axios from "axios";
import {useHistory} from 'react-router-dom'

const Signup = () => {

    const [show,setShow]=useState(false);
    const [name,setName]=useState();
    const [email, setEmail]=useState();
    const [confirmpassword,setConfirmpassword]=useState();
    const [password,setpassword]=useState();
    const [pic,setPic]=useState();
    const [picLoading,setPicLoading]=useState(false);
    const toast=useToast();
    const history=useHistory();

    const handleclick=()=>setShow(!show);
    const postDetails = (pics) => {
        setPicLoading(true);
        if (pics === undefined) {
          toast({
            title: "Please Select an Image!",
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
          return;
        }
        console.log(pics);
        if (pics.type === "image/jpeg" || pics.type === "image/png") {
          const data = new FormData();
          data.append("file", pics);
          data.append("upload_preset", "chat-app");
          data.append("cloud_name", "dgcmiagav");
          fetch("https://api.cloudinary.com/v1_1/dgcmiagav/image/upload", {
            method: "post",
            body: data,
          })
            .then((res) => res.json())
            .then((data) => {
              setPic(data.url.toString());
              console.log(data.url.toString());
              setPicLoading(false);
            })
            .catch((err) => {
              console.log(err);
              setPicLoading(false);
            });
        } else {
          toast({
            title: "Please Select an Image!",
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
          setPicLoading(false);
          return;
        }
      };
    const submitHandler=async()=>{
        setPicLoading(true);
        if(!name || !email ||!password || !confirmpassword){
            toast({
                title:"Please Fill all the fields",
                status:"warning",
                duration:4000,
                isClosable:true,
                position:"top-left",
            })
            setPicLoading(false);
            return
        }
        if(password!== confirmpassword){
            toast({
                title:"Passwords Don't Match",
                status:"warning",
                duration:4000,
                isClosable:true,
                position:"top-left",
            })
            setPicLoading(false);
            return  
        }
        try{
            const config={
                headers:{
                    "Content-type":"application/json"
                },
            };
            const { data } = await axios.post(
                "http://localhost:5000/api/user",
                {
                  name,
                  email,
                  password,
                  pic,
                },
                config
              );
            toast({
                title:"Registration Successful",
                status:"success",
                duration:4000,
                isClosable:true,
                position:"top-left",
            })
            localStorage.setItem("userInfo",JSON.stringify(data));
            setPicLoading(false);
            history.push("chats")
        }catch(error){
            toast({
                title:"Error Occured",
                status:"warning",
                description:error.response.data.message,
                duration:4000,
                isClosable:true,
                position:"top-left",
            })
            setPicLoading(false);
        }
    };

  return (
    <VStack spacing={"5px"} color={"black"}>
        <FormControl id="first-name" isRequired>
            <FormLabel>Name:</FormLabel>
            <Input
            placeholder='Enter Your Name'
            onChange={(e)=>setName(e.target.value)}/>
        </FormControl>
        <FormControl id="email" isRequired>
            <FormLabel>Email ID:</FormLabel>
            <Input
            placeholder='Enter Your Emain ID'
            onChange={(e)=>setEmail(e.target.value)}/>
        </FormControl>
        <FormControl id="password" isRequired>
            <FormLabel>Password:</FormLabel>
            <InputGroup>
            <Input
            placeholder='Enter Your Password'
            type={show? "text":'password'}
            onChange={(e)=>setpassword(e.target.value)}/>
            <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={handleclick}>
                    {show ? "Hide":"Show"}
                </Button>
            </InputRightElement>
            </InputGroup>
        </FormControl>
        <FormControl id="password" isRequired>
        <FormLabel>Confirm Password</FormLabel>
        <InputGroup size="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="Confirm password"
            onChange={(e) => setConfirmpassword(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleclick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>
        <FormControl id="pic">
        <FormLabel>Upload your Picture</FormLabel>
        <Input
          type="file"
          p={1.5}
          accept="image/*"
          onChange={(e) => postDetails(e.target.files[0])}
        />
      </FormControl>
      <Button
        colorScheme="blue"
        width="100%"
        style={{ marginTop: 15 }}
        onClick={submitHandler}
        isLoading={picLoading}
      >
        Sign Up
      </Button>
    </VStack>
  )
}

export default Signup
