import React, { useState, useEffect } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { loadPhotoWithAuth } from "../lib/photo-utils";

interface AuthorizedImageProps extends Omit<BoxProps, "as"> {
  src: string | null | undefined;
  alt?: string;
  fallback?: string;
}

/**
 * Компонент для отображения изображений, которые требуют авторизации
 * Автоматически загружает изображение с токеном авторизации
 */
const AuthorizedImage: React.FC<AuthorizedImageProps> = ({
  src,
  alt = "",
  fallback = "/placeholder.svg",
  ...boxProps
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setImageSrc(fallback);
      setIsLoading(false);
      return;
    }

    // Если это data URL или placeholder, используем напрямую
    if (
      src.startsWith("data:") ||
      src === "/placeholder.svg" ||
      src.includes("placeholder")
    ) {
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    // Загружаем фото с авторизацией
    setIsLoading(true);
    setHasError(false);

    loadPhotoWithAuth(src)
      .then((blobUrl) => {
        if (blobUrl) {
          setImageSrc(blobUrl);
          setHasError(false);
        } else {
          setImageSrc(fallback);
          setHasError(true);
        }
      })
      .catch((error) => {
        console.error("Ошибка при загрузке изображения:", error);
        setImageSrc(fallback);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Очищаем blob URL при размонтировании или изменении src
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, fallback]);

  // Очищаем blob URL при размонтировании
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  return (
    <Box
      as="img"
      src={imageSrc}
      alt={alt}
      {...boxProps}
      opacity={isLoading ? 0.5 : 1}
      transition="opacity 0.2s"
    />
  );
};

export default AuthorizedImage;
