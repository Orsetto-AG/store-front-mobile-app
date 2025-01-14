import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApplyFilter: (filter: string) => void;
    onResetFilter: () => void; // Yeni prop: Filtreleri sıfırlama
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApplyFilter, onResetFilter }) => {
    const [selectedFilter, setSelectedFilter] = useState('');

    const handleSelectFilter = (filter: string) => {
        setSelectedFilter(filter);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Filter</Text>

                    {/* Fiyat Artan */}
                    <TouchableOpacity
                        onPress={() => handleSelectFilter('price_asc')}
                        style={[
                            styles.filterOption,
                            selectedFilter === 'price_asc' && styles.selectedOption,
                        ]}
                    >
                        <Text style={styles.filterOptionText}>Price: Low to High</Text>
                    </TouchableOpacity>

                    {/* Fiyat Azalan */}
                    <TouchableOpacity
                        onPress={() => handleSelectFilter('price_desc')}
                        style={[
                            styles.filterOption,
                            selectedFilter === 'price_desc' && styles.selectedOption,
                        ]}
                    >
                        <Text style={styles.filterOptionText}>Price: High to Low</Text>
                    </TouchableOpacity>

                    {/* İsme Göre A-Z */}
                    <TouchableOpacity
                        onPress={() => handleSelectFilter('name_asc')}
                        style={[
                            styles.filterOption,
                            selectedFilter === 'name_asc' && styles.selectedOption,
                        ]}
                    >
                        <Text style={styles.filterOptionText}>Name: A-Z</Text>
                    </TouchableOpacity>

                    {/* İsme Göre Z-A */}
                    <TouchableOpacity
                        onPress={() => handleSelectFilter('name_desc')}
                        style={[
                            styles.filterOption,
                            selectedFilter === 'name_desc' && styles.selectedOption,
                        ]}
                    >
                        <Text style={styles.filterOptionText}>Name: Z-A</Text>
                    </TouchableOpacity>

                    {/* Filtre Uygula Butonu */}
                    <TouchableOpacity
                        onPress={() => {
                            onApplyFilter(selectedFilter);
                            onClose();
                        }}
                        style={styles.applyButton}
                    >
                        <Text style={styles.applyButtonText}>Apply</Text>
                    </TouchableOpacity>

                    {/* Filtreleri Sıfırla Butonu */}
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedFilter('');
                            onResetFilter();
                            onClose();
                        }}
                        style={styles.resetButton}
                    >
                        <Text style={styles.resetButtonText}>Reset Filters</Text>
                    </TouchableOpacity>

                    {/* Modal Kapat Butonu */}
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 320,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    filterOption: {
        width: '100%',
        padding: 15,
        marginVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    selectedOption: {
        borderColor: '#007bff',
        backgroundColor: '#e6f0ff',
    },
    filterOptionText: {
        fontSize: 18,
        color: '#333',
    },
    applyButton: {
        marginTop: 20,
        width: '100%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#007bff',
        alignItems: 'center',
    },
    applyButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resetButton: {
        marginTop: 10,
        width: '100%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#ffcc00',
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#333',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 10,
        width: '100%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#ff5c5c',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default FilterModal;
