import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import AuthorizedAvatar from "../components/AuthorizedAvatar";
import { ArrowBackIcon } from "@chakra-ui/icons";
import MainLayout from "../components/MainLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { avatarsAPI, AvatarModerationRequest } from "../lib/api";
import { mapBackendUserToEmployee } from "../lib/api-mapper";
import { getPhotoUrl } from "../lib/photo-utils";

type Status = "pending" | "approved" | "rejected";

interface ModerationRequest {
  id: string;
  employee: ReturnType<typeof mapBackendUserToEmployee>;
  updatedAt: string;
  checkedAt?: string;
  status: Status;
  comment?: string;
  avatarUrl: string;
}

const ModerationPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<Status>("pending");
  const [activeFilter, setActiveFilter] = useState<FilterType>("pending");
  const [rejectingRequest, setRejectingRequest] =
    useState<ModerationRequest | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const {
    isOpen: isRejectModalOpen,
    onOpen: onRejectModalOpen,
    onClose: onRejectModalClose,
  } = useDisclosure();

  const { data: pendingAvatars = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ["avatars", "pending"],
    queryFn: () => avatarsAPI.getPending(),
  });

  const { data: acceptedAvatars = [], isLoading: isLoadingAccepted } = useQuery(
    {
      queryKey: ["avatars", "accepted"],
      queryFn: () => avatarsAPI.getAccepted(),
    }
  );

  const { data: rejectedAvatars = [], isLoading: isLoadingRejected } = useQuery(
    {
      queryKey: ["avatars", "rejected"],
      queryFn: () => avatarsAPI.getRejected(),
    }
  );

  // Преобразуем данные аватаров в формат ModerationRequest
  const moderationRequests = useMemo<ModerationRequest[]>(() => {
    const pending = pendingAvatars.map((avatar) => ({
      id: avatar.id,
      employee: mapBackendUserToEmployee(avatar.user),
      updatedAt: new Date(avatar.updated_at).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      status: "pending" as Status,
      avatarUrl: getPhotoUrl(avatar.url) || avatar.url,
    }));

    const accepted = acceptedAvatars.map((avatar) => ({
      id: avatar.id,
      employee: mapBackendUserToEmployee(avatar.user),
      updatedAt: new Date(avatar.updated_at).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      checkedAt: new Date(avatar.updated_at).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      status: "approved" as Status,
      avatarUrl: getPhotoUrl(avatar.url) || avatar.url,
    }));

    const rejected = rejectedAvatars.map((avatar) => ({
      id: avatar.id,
      employee: mapBackendUserToEmployee(avatar.user),
      updatedAt: new Date(avatar.updated_at).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      checkedAt: new Date(avatar.updated_at).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      status: "rejected" as Status,
      avatarUrl: getPhotoUrl(avatar.url) || avatar.url,
      comment: avatar.rejection_reason || undefined,
    }));

    return [...pending, ...accepted, ...rejected];
  }, [pendingAvatars, acceptedAvatars, rejectedAvatars]);

  // Фильтрация заявок
  const filteredRequests = useMemo(() => {
    return moderationRequests.filter((req) => req.status === activeStatus);
  }, [moderationRequests, activeStatus]);

  // Подсчет заявок по статусам
  const statusCounts = useMemo(() => {
    return {
      pending: moderationRequests.filter((r) => r.status === "pending").length,
      approved: moderationRequests.filter((r) => r.status === "approved")
        .length,
      rejected: moderationRequests.filter((r) => r.status === "rejected")
        .length,
    };
  }, [moderationRequests]);

  const handleApprove = async (request: ModerationRequest) => {
    try {
      await avatarsAPI.moderate(request.id, "ACCEPTED");
      toast({
        status: "success",
        title: "Фото одобрено",
        description: "Фотография сотрудника успешно одобрена",
        duration: 3000,
        isClosable: true,
      });
      // Обновляем списки аватаров
      queryClient.invalidateQueries({ queryKey: ["avatars"] });
    } catch (error) {
      toast({
        status: "error",
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось одобрить фотографию",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRejectClick = (request: ModerationRequest) => {
    setRejectingRequest(request);
    setRejectComment("");
    onRejectModalOpen();
  };

  const handleRejectConfirm = async () => {
    if (!rejectingRequest) return;

    try {
      await avatarsAPI.moderate(rejectingRequest.id, "REJECTED", rejectComment);
      toast({
        status: "success",
        title: "Фото отклонено",
        description: "Фотография сотрудника отклонена",
        duration: 3000,
        isClosable: true,
      });
      // Обновляем списки аватаров
      queryClient.invalidateQueries({ queryKey: ["avatars"] });
      onRejectModalClose();
      setRejectingRequest(null);
      setRejectComment("");
    } catch (error) {
      toast({
        status: "error",
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось отклонить фотографию",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            bg="gray.100"
            color="gray.700"
            px={3}
            py={1.5}
            borderRadius="full"
            fontSize="sm"
            fontWeight="normal"
          >
            <HStack spacing={2}>
              <Box w="6px" h="6px" bg="gray.500" borderRadius="full" />
              <Text>В ожидании</Text>
            </HStack>
          </Badge>
        );
      case "approved":
        return (
          <Badge
            bg="green.100"
            color="green.700"
            px={3}
            py={1.5}
            borderRadius="full"
            fontSize="sm"
            fontWeight="normal"
          >
            <HStack spacing={2}>
              <Text fontSize="sm">✓</Text>
              <Text>Одобрено</Text>
            </HStack>
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            bg="red.100"
            color="red.700"
            px={3}
            py={1.5}
            borderRadius="full"
            fontSize="sm"
            fontWeight="normal"
          >
            <HStack spacing={2}>
              <Box w="6px" h="6px" bg="red.500" borderRadius="full" />
              <Text>Отклонено</Text>
            </HStack>
          </Badge>
        );
    }
  };

  const getStatusCircleColor = (status: Status) => {
    switch (status) {
      case "pending":
        return "gray.300";
      case "approved":
        return "green.300";
      case "rejected":
        return "red.300";
    }
  };

  return (
    <MainLayout>
      <Box p={6} bg="white" minH="100vh">
        <VStack spacing={6} align="stretch">
          {/* Кнопка Назад */}
          <HStack>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              onClick={() => navigate(-1)}
              color="#763186"
              _hover={{ bg: "purple.50" }}
              fontSize="md"
              fontWeight="normal"
            >
              Назад
            </Button>
          </HStack>

          {/* Табы статусов */}
          <HStack spacing={3}>
            <Button
              variant={activeStatus === "pending" ? "solid" : "outline"}
              bg={activeStatus === "pending" ? "#763186" : "white"}
              color={activeStatus === "pending" ? "white" : "gray.700"}
              borderColor={activeStatus === "pending" ? "#763186" : "gray.300"}
              _hover={
                activeStatus === "pending"
                  ? { bg: "#5e2770" }
                  : { bg: "gray.50", borderColor: "gray.400" }
              }
              px={6}
              py={3}
              fontSize="md"
              fontWeight="medium"
              onClick={() => setActiveStatus("pending")}
            >
              <HStack spacing={2}>
                <Text>В ожидании</Text>
                {statusCounts.pending > 0 && (
                  <Box
                    w="24px"
                    h="24px"
                    borderRadius="full"
                    bg={
                      activeStatus === "pending"
                        ? "rgba(255,255,255,0.3)"
                        : getStatusCircleColor("pending")
                    }
                    color={activeStatus === "pending" ? "white" : "gray.700"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {statusCounts.pending}
                  </Box>
                )}
              </HStack>
            </Button>
            <Button
              variant={activeStatus === "approved" ? "solid" : "outline"}
              bg={activeStatus === "approved" ? "#763186" : "white"}
              color={activeStatus === "approved" ? "white" : "gray.700"}
              borderColor={activeStatus === "approved" ? "#763186" : "gray.300"}
              _hover={
                activeStatus === "approved"
                  ? { bg: "#5e2770" }
                  : { bg: "gray.50", borderColor: "gray.400" }
              }
              px={6}
              py={3}
              fontSize="md"
              fontWeight="medium"
              onClick={() => setActiveStatus("approved")}
            >
              <HStack spacing={2}>
                <Text>Одобрено</Text>
                {statusCounts.approved > 0 && (
                  <Box
                    w="24px"
                    h="24px"
                    borderRadius="full"
                    bg={
                      activeStatus === "approved"
                        ? "rgba(255,255,255,0.3)"
                        : getStatusCircleColor("approved")
                    }
                    color={activeStatus === "approved" ? "white" : "gray.700"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {statusCounts.approved}
                  </Box>
                )}
              </HStack>
            </Button>
            <Button
              variant={activeStatus === "rejected" ? "solid" : "outline"}
              bg={activeStatus === "rejected" ? "#763186" : "white"}
              color={activeStatus === "rejected" ? "white" : "gray.700"}
              borderColor={activeStatus === "rejected" ? "#763186" : "gray.300"}
              _hover={
                activeStatus === "rejected"
                  ? { bg: "#5e2770" }
                  : { bg: "gray.50", borderColor: "gray.400" }
              }
              px={6}
              py={3}
              fontSize="md"
              fontWeight="medium"
              onClick={() => setActiveStatus("rejected")}
            >
              <HStack spacing={2}>
                <Text>Отклонено</Text>
                {statusCounts.rejected > 0 && (
                  <Box
                    w="24px"
                    h="24px"
                    borderRadius="full"
                    bg={
                      activeStatus === "rejected"
                        ? "rgba(255,255,255,0.3)"
                        : getStatusCircleColor("rejected")
                    }
                    color={activeStatus === "rejected" ? "white" : "gray.700"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {statusCounts.rejected}
                  </Box>
                )}
              </HStack>
            </Button>
          </HStack>

          {/* Карточки заявок */}
          <VStack spacing={4} align="stretch">
            {(isLoadingPending || isLoadingAccepted || isLoadingRejected) &&
            activeStatus === "pending" ? (
              <Box
                bg="white"
                borderRadius="lg"
                p={8}
                border="1px solid"
                borderColor="gray.200"
                textAlign="center"
              >
                <Spinner size="xl" color="#763186" />
                <Text color="gray.500" mt={4}>
                  Загрузка...
                </Text>
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Box
                bg="white"
                borderRadius="lg"
                p={8}
                border="1px solid"
                borderColor="gray.200"
                textAlign="center"
              >
                <Text color="gray.500">Нет заявок для отображения</Text>
              </Box>
            ) : (
              filteredRequests.map((request) => (
                <Box
                  key={request.id}
                  bg="white"
                  borderRadius="lg"
                  p={6}
                  border="1px solid"
                  borderColor="gray.200"
                  boxShadow="sm"
                  position="relative"
                >
                  <HStack spacing={6} align="flex-start">
                    {/* Фото */}
                    <Box position="relative">
                      <AuthorizedAvatar
                        size="xl"
                        name={request.employee.name}
                        src={request.avatarUrl}
                        borderRadius="md"
                      />
                    </Box>

                    {/* Информация */}
                    <VStack align="start" spacing={3} flex={1}>
                      <HStack
                        justify="space-between"
                        w="100%"
                        align="flex-start"
                      >
                        <VStack align="start" spacing={1} flex={1}>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="gray.900"
                          >
                            {request.employee.lastName || ""}{" "}
                            {request.employee.firstName || ""}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Обновлено: {request.updatedAt}
                          </Text>
                          {request.checkedAt && (
                            <Text fontSize="sm" color="gray.600">
                              Проверено: {request.checkedAt}
                            </Text>
                          )}
                          {request.comment && (
                            <Text fontSize="sm" color="gray.600">
                              Комментарий: {request.comment}
                            </Text>
                          )}
                        </VStack>
                        <Box alignSelf="flex-start">
                          {getStatusBadge(request.status)}
                        </Box>
                      </HStack>

                      {/* Кнопки действий */}
                      {request.status === "pending" && (
                        <HStack spacing={3} mt={2}>
                          <Button
                            bg="#763186"
                            color="white"
                            _hover={{ bg: "#5e2770" }}
                            px={6}
                            py={2}
                            fontSize="md"
                            onClick={() => handleApprove(request)}
                          >
                            Одобрить
                          </Button>
                          <Button
                            variant="outline"
                            borderColor="#763186"
                            color="#763186"
                            bg="white"
                            _hover={{ bg: "purple.50" }}
                            px={6}
                            py={2}
                            fontSize="md"
                            onClick={() => handleRejectClick(request)}
                          >
                            Отклонить
                          </Button>
                        </HStack>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </VStack>
      </Box>

      {/* Модальное окно отклонения */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={onRejectModalClose}
        isCentered
        size="md"
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent borderRadius="lg">
          <ModalHeader fontSize="lg" fontWeight="bold" color="gray.900" pb={2}>
            Отклонение фотографии сотрудника
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Пожалуйста, укажите причину отклонения фотографии
              </Text>
              <Textarea
                placeholder="Например, фотография плохого качества."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                bg="gray.50"
                borderColor="gray.300"
                _focus={{
                  borderColor: "#763186",
                  boxShadow: "0 0 0 1px #763186",
                }}
                borderRadius="md"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              color="#763186"
              mr={3}
              onClick={onRejectModalClose}
              _hover={{ bg: "purple.50" }}
            >
              Закрыть
            </Button>
            <Button
              bg="#763186"
              color="white"
              _hover={{ bg: "#5e2770" }}
              onClick={handleRejectConfirm}
              px={6}
            >
              Отклонить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  );
};

export default ModerationPage;
