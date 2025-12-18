import React, { useState, useEffect } from "react";
import { Avatar, AvatarProps } from "@chakra-ui/react";
import { loadPhotoWithAuth, clearPhotoFromCache } from "../lib/photo-utils";

interface AuthorizedAvatarProps extends AvatarProps {
  src?: string | null;
}

/**
 * Компонент Avatar, который автоматически загружает фото с токеном авторизации
 */
const AuthorizedAvatar: React.FC<AuthorizedAvatarProps> = ({
  src,
  ...avatarProps
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(
    src || undefined
  );

  useEffect(() => {
    if (!src) {
      setImageSrc(undefined);
      return;
    }

    // Если это data URL или placeholder, используем напрямую
    if (
      src.startsWith("data:") ||
      src === "/placeholder.svg" ||
      src.includes("placeholder")
    ) {
      setImageSrc(src);
      return;
    }

    // Загружаем фото с авторизацией (кеш обрабатывается внутри loadPhotoWithAuth)
    loadPhotoWithAuth(src)
      .then((blobUrl) => {
        if (blobUrl) {
          setImageSrc(blobUrl);
        } else {
          setImageSrc(undefined);
        }
      })
      .catch((error) => {
        console.error("Ошибка при загрузке фото для Avatar:", error);
        setImageSrc(undefined);
      });
  }, [src]);

  return <Avatar src={imageSrc} {...avatarProps} />;
};

export default AuthorizedAvatar;
