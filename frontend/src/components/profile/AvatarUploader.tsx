import React, { useRef } from "react";
import { Avatar, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";

interface AvatarUploaderProps {
  fullName: string;
  photoUrl?: string;
  onSelect: (file: File) => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  fullName,
  photoUrl,
  onSelect,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelect(file);
    }
  };

  return (
    <Box
      border="2px dashed"
      borderColor="gray.300"
      borderRadius="lg"
      p={6}
      textAlign="center"
    >
      <VStack spacing={4}>
        <Avatar
          size="2xl"
          src={photoUrl}
          name={fullName}
          borderRadius="md"
        />
        <Button
          onClick={() => inputRef.current?.click()}
          colorScheme="purple"
          variant="outline"
        >
          Загрузить фото
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleChange}
        />
        <VStack spacing={1} fontSize="sm" color="gray.600">
          <Text>JPG, PNG или WebP. Не более 5 МБ.</Text>
          <HStack spacing={1}>
            <Text>Постарайтесь загрузить фото в хорошем качестве.</Text>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default AvatarUploader;




