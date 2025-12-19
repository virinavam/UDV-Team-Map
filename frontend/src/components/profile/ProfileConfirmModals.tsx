/**
 * Компонент модальных окон подтверждения для профиля
 */

import React from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Button,
    Text,
} from "@chakra-ui/react";

interface ProfileConfirmModalsProps {
    isSaveConfirmOpen: boolean;
    onSaveConfirmClose: () => void;
    onSaveConfirmYes: () => void;
    onSaveConfirmNo: () => void;
    isFinalConfirmOpen: boolean;
    onFinalConfirmClose: () => void;
    onFinalConfirm: () => void;
    isCancelConfirmOpen: boolean;
    onCancelConfirmClose: () => void;
    onCancelConfirmYes: () => void;
    isSaving: boolean;
}

export const ProfileConfirmModals: React.FC<ProfileConfirmModalsProps> = ({
                                                                              isSaveConfirmOpen,
                                                                              onSaveConfirmClose,
                                                                              onSaveConfirmYes,
                                                                              onSaveConfirmNo,
                                                                              isFinalConfirmOpen,
                                                                              onFinalConfirmClose,
                                                                              onFinalConfirm,
                                                                              isCancelConfirmOpen,
                                                                              onCancelConfirmClose,
                                                                              onCancelConfirmYes,
                                                                              isSaving,
                                                                          }) => {
    return (
        <>
            {/* Первое модальное окно подтверждения */}
            <Modal isOpen={isSaveConfirmOpen} onClose={onSaveConfirmClose} isCentered>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Сохранить изменения?</ModalHeader>
                    <ModalBody>
                        <Text>
                            Примененные изменения будут отправлены на проверку модератору
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onSaveConfirmNo}>
                            Нет
                        </Button>
                        <Button bg="#763186"
                                color="white"
                                _hover={{bg: "#5a2568"}} onClick={onSaveConfirmYes}>
                            Да
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Второе модальное окно подтверждения для сохранения */}
            <Modal
                isOpen={isFinalConfirmOpen}
                onClose={onFinalConfirmClose}
                isCentered
            >
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Уверены ли вы?</ModalHeader>
                    <ModalBody>
                        <Text>Вы уверены, что хотите отправить изменения на проверку?</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onFinalConfirmClose}>
                            Нет
                        </Button>
                        <Button
                            bg="#763186"
                            color="white"
                            _hover={{bg: "#5a2568"}}
                            onClick={onFinalConfirm}
                            isLoading={isSaving}
                        >
                            Да
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Модальное окно подтверждения для отмены */}
            <Modal
                isOpen={isCancelConfirmOpen}
                onClose={onCancelConfirmClose}
                isCentered
            >
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>
                        Вы уверены, что не хотите сохранять изменения?
                    </ModalHeader>
                    <ModalBody>
                        <Text>Все внесенные изменения будут потеряны</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onCancelConfirmClose}>
                            Нет
                        </Button>
                        <Button bg="#763186"
                                color="white"
                                _hover={{bg: "#5a2568"}} onClick={onCancelConfirmYes}>
                            Да
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};
