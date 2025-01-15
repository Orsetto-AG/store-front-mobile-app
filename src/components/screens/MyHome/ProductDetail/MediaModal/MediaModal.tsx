import React, { useState, useRef } from 'react';
import {
    Modal,
    View,
    Image,
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    FlatList
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Video from 'react-native-video';

interface MediaModalProps {
    isVisible: boolean;
    onClose: () => void;
    mediaList: { uri: string; type: 'image' | 'video' }[];
    initialIndex: number;
}

const MediaModal = ({ isVisible, onClose, mediaList, initialIndex }: MediaModalProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [videoPositions, setVideoPositions] = useState<Record<number, number>>({});
    const translateY = useRef(new Animated.Value(0)).current;
    const videoRef = useRef<Video | null>(null);
    const screenWidth = Dimensions.get('window').width;
    const handleGesture = Animated.event(
        [{ nativeEvent: { translationY: translateY } }],
        { useNativeDriver: false }
    );

    const handleGestureStateChange = ({ nativeEvent }) => {
        if (nativeEvent.state === State.END) {
            if (nativeEvent.translationY > 150) {
                // Yeterince aşağı kaydırıldığında modal'ı kapat
                Animated.timing(translateY, {
                    toValue: Dimensions.get('window').height,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    onClose();
                    translateY.setValue(0); // Pozisyonu sıfırla
                });
            } else {
                // Yeterince aşağı kaydırılmadığında modal eski yerine dönsün
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
        }
    };

    const renderItem = ({ item, index }: { item: { uri: string; type: 'image' | 'video' }; index: number }) => {
        if (item.type === 'video') {
            return (
                <View style={styles.videoContainer}>
                    <Video
                        ref={(ref) => {
                            if (index === currentIndex) {
                                videoRef.current = ref;
                            }
                        }}
                        source={{ uri: item.uri }}
                        style={styles.video}
                        resizeMode="contain"
                        controls={true}
                        paused={currentIndex !== index} // Aktif video oynar
                        onProgress={(progress) => {
                            setVideoPositions((prev) => ({
                                ...prev,
                                [currentIndex]: progress.currentTime,
                            }));
                        }}
                        onLoad={() => {
                            if (videoPositions[currentIndex] !== undefined) {
                                videoRef.current?.seek(videoPositions[currentIndex]);
                            }
                        }}
                        onError={(error) => console.log('Video Error:', error)}
                    />
                </View>
            );
        }
        return <Image source={{ uri: item.uri }} style={styles.image} resizeMode="contain" />;
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <PanGestureHandler
                onGestureEvent={handleGesture}
                onHandlerStateChange={handleGestureStateChange}
            >
                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY }] },
                    ]}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>←</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={mediaList}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        initialScrollIndex={initialIndex}
                        onMomentumScrollEnd={(event) => {
                            const index = Math.floor(
                                event.nativeEvent.contentOffset.x / Dimensions.get('window').width
                            );
                            if (index !== currentIndex) {
                                setCurrentIndex(index);
                            }
                        }}
                        getItemLayout={(data, index) => ({
                            length: screenWidth, // Her öğenin genişliği
                            offset: screenWidth * index, // Öğenin başlangıç konumu
                            index,
                        })}
                    />
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{`Media ${currentIndex + 1} of ${mediaList.length}`}</Text>
                    </View>
                </Animated.View>
            </PanGestureHandler>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50,
    },
    closeButton: {
        padding: 10,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 24,
    },
    videoContainer: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    image: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.6,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        color: 'white',
        fontSize: 16,
    },
});

export default MediaModal;
