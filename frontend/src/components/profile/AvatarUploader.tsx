import React, { useRef, useState } from "react";
import { Avatar, Box, Text, VStack } from "@chakra-ui/react";

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
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onSelect(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <VStack spacing={4} align="stretch" w="200px">
      {/* Квадратное фото */}
      <Box
        w="200px"
        h="200px"
        borderRadius="lg"
        overflow="hidden"
        border="2px solid"
        borderColor="gray.200"
        bg="gray.100"
        position="relative"
      >
        {photoUrl ? (
          <Box
            as="img"
            src={photoUrl}
            alt={fullName}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        ) : (
          <Avatar
            size="full"
            name={fullName}
            borderRadius="lg"
          />
        )}
      </Box>

      {/* Область drag-and-drop */}
      <Box
        border="2px dashed"
        borderColor={isDragging ? "purple.400" : "gray.300"}
        borderRadius="md"
        p={4}
        textAlign="center"
        cursor="pointer"
        bg={isDragging ? "purple.50" : "white"}
        _hover={{ borderColor: "purple.400", bg: "purple.50" }}
        transition="all 0.2s"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Text fontSize="sm" color="gray.600">
          Выберите файл или перетяните его сюда
        </Text>
      </Box>

      {/* Требования к фото */}
      <VStack align="start" spacing={1} fontSize="xs" color="gray.600">
        <Text fontWeight="semibold">Требования к фото:</Text>
        <Text>1. На фото запечатлено лицо сотрудника</Text>
        <Text>2. Хорошее качество</Text>
        <Text>3. Нейтральный фон</Text>
      </VStack>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleChange}
      />
    </VStack>
  );
};

export default AvatarUploader;






