import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Bookings } from './pages/Bookings';
import { Guests } from './pages/Guests';
import { Housekeeping } from './pages/Housekeeping';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Calendar } from './pages/Calendar';
import { Hotels } from './pages/Hotels';
import { RoomManagement } from './pages/RoomManagement';
import { ImportData } from './pages/ImportData';
import { SuperAdminPanel } from './components/superadmin/SuperAdminPanel';
import { Page, Property, Room, Integration, Booking, PlatformSettings, PaymentMode, PaymentAccount, Guest, User, HousekeepingStatus, RoomType, BookingStatus } from './types';
import { mockProperties, mockBookings, mockGuests, mockRooms, mockRevenueData, mockIntegrations, mockUsers, mockAuditLogs, mockPlatformSettings, mockPaymentModes, mockPaymentAccounts, mockSaasCustomers, mockSystemLogs } from './data/mockData';

function parseDate(dateInput: string | number | Date): Date | null {
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput;
    }

    if (typeof dateInput === 'number' && dateInput > 1) {
        const excelDate = new Date((dateInput - 25569) * 86400 * 1000);
        if (dateInput < 60) excelDate.setDate(excelDate.getDate() - 1);
        return excelDate;
    }

    if (typeof dateInput !== 'string') return null;
    
    const str = dateInput.trim();
    let date = new Date(str);
    if (!isNaN(date.getTime())) return date;

    const specialFormatMatch = str.match(/^(\d{1,2})-(\w{3})-(\d{4})$/);
    if (specialFormatMatch) {
        const day = parseInt(specialFormatMatch[1], 10);
        const monthStr = specialFormatMatch[2].toLowerCase();
        const year = parseInt(specialFormatMatch[3], 10);
        const monthMap: { [key: string]: number } = {'jan':0,'feb':1,'mar':2,'apr':3,'may':4,'jun':5,'jul':6,'aug':7,'sep':8,'oct':9,'nov':10,'dec':11};
        const monthIndex = monthMap[monthStr];
        if (day && monthIndex !== undefined && year) {
            date = new Date(Date.UTC(year, monthIndex, day));
            if (!isNaN(date.getTime())) return date;
        }
    }
    return null;
}

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'hotel' | 'superadmin'>('hotel');
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(mockProperties[0]?.id || '');

    // Data states
    const [propertiesData, setPropertiesData] = useState<Property[]>(mockProperties);
    const [roomsData, setRoomsData] = useState<Room[]>(mockRooms);
    const [integrationsData, setIntegrationsData] = useState<Integration[]>(mockIntegrations);
    const [bookingsData, setBookingsData] = useState<Booking[]>(mockBookings);
    const [guestsData, setGuestsData] = useState<Guest[]>(mockGuests);
    const [usersData, setUsersData] = useState<User[]>(mockUsers);
    
    // Settings states
    const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(mockPlatformSettings);
    const [paymentModes, setPaymentModes] = useState<PaymentMode[]>(mockPaymentModes);
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(mockPaymentAccounts);


    const selectedProperty = useMemo(() => 
        propertiesData.find(p => p.id === selectedPropertyId) || propertiesData[0],
        [selectedPropertyId, propertiesData]
    );

    const filteredData = useMemo(() => {
        const rooms = roomsData.filter(r => r.propertyId === selectedPropertyId);
        const bookings = bookingsData.filter(b => b.propertyId === selectedPropertyId);
        const allBookingsForProperty = bookingsData.filter(b => b.propertyId === selectedPropertyId);

        return {
            rooms,
            bookings,
            guests: guestsData,
            revenueData: mockRevenueData[selectedPropertyId] || [],
            allBookings: bookingsData,
            allBookingsForProperty
        };
    }, [selectedPropertyId, roomsData, bookingsData, guestsData]);

    const handleRoomUpdate = (updatedRoom: Room) => {
        setRoomsData(prevRooms => prevRooms.map(room => room.id === updatedRoom.id ? updatedRoom : room));
    };
    
    const handleSaveRoom = (roomToSave: Omit<Room, 'id' | 'propertyId' | 'housekeepingStatus'> & { id?: string }) => {
        setRoomsData(prev => {
            if (roomToSave.id) {
                // Update existing room
                return prev.map(r => r.id === roomToSave.id ? { ...r, ...roomToSave } : r);
            } else {
                // Create new room
                const newRoom: Room = {
                    id: `r${Date.now()}`,
                    name: roomToSave.name,
                    type: roomToSave.type as RoomType,
                    propertyId: selectedPropertyId,
                    housekeepingStatus: HousekeepingStatus.Clean
                };
                return [...prev, newRoom];
            }
        });
    };

    const handleDeleteRoom = (roomId: string) => {
        setRoomsData(prev => prev.filter(r => r.id !== roomId));
        // Also cancel any future bookings for this room
        setBookingsData(prev => prev.filter(b => b.roomId !== roomId));
    };

    const handleBulkSaveRooms = (prefix: string, start: number, end: number, type: RoomType) => {
        const newRooms: Room[] = [];
        for (let i = start; i <= end; i++) {
            const newRoom: Room = {
                id: `r${Date.now()}-${i}`,
                name: `${prefix}${i}`,
                type: type,
                propertyId: selectedPropertyId,
                housekeepingStatus: HousekeepingStatus.Clean,
            };
            newRooms.push(newRoom);
        }
        setRoomsData(prev => [...prev, ...newRooms]);
    };

    const handleSaveIntegration = (updatedIntegration: Integration) => {
        setIntegrationsData(prev => 
            prev.map(int => int.id === updatedIntegration.id ? updatedIntegration : int)
        );
    };

    const handleSaveGuest = (guestToSave: Omit<Guest, 'id'> & { id?: string }) => {
        let savedGuest: Guest;
        setGuestsData(prev => {
            if (guestToSave.id) {
                 const updatedGuests = prev.map(g => g.id === guestToSave.id ? { ...g, ...guestToSave } as Guest : g);
                 savedGuest = guestToSave as Guest;
                 return updatedGuests;
            } else {
                const newGuest: Guest = {
                    ...guestToSave,
                    id: `g${Date.now()}`
                };
                savedGuest = newGuest;
                return [...prev, newGuest];
            }
        });
        return savedGuest!;
    };
    
    const handleDeleteGuest = (guestId: string) => {
        setGuestsData(prev => prev.filter(g => g.id !== guestId));
        // Decide how to handle bookings of deleted guest, e.g., cancel them
        setBookingsData(prev => prev.filter(b => b.guestId !== guestId));
    };
    
    const handleSaveBooking = (bookingToSave: Omit<Booking, 'id'> & { id?: string }) => {
        setBookingsData(prev => {
            if (bookingToSave.id) {
                return prev.map(b => b.id === bookingToSave.id ? { ...b, ...bookingToSave } as Booking : b);
            } else {
                const newBooking: Booking = {
                    ...bookingToSave,
                    id: `b${Date.now()}`
                } as Booking;
                return [...prev, newBooking];
            }
        });
    };
    
    const handleDeleteBooking = (bookingId: string) => {
        setBookingsData(prev => prev.filter(b => b.id !== bookingId));
    };
    
    const handleSaveUser = (user: Omit<User, 'id'> & { id?: string }) => {
        setUsersData(prev => {
            if (user.id) {
                return prev.map(u => u.id === user.id ? { ...u, ...user } : u);
            } else {
                const newUser: User = { id: `u${Date.now()}`, ...user };
                return [...prev, newUser];
            }
        });
    };
    
    const handleDeleteUser = (userId: string) => {
        setUsersData(prev => prev.filter(u => u.id !== userId));
    };

    const handleUpdateSettings = (newSettings: PlatformSettings) => {
        setPlatformSettings(newSettings);
    };

    const handleSavePaymentMode = (mode: PaymentMode) => {
        setPaymentModes(prev => {
            if (prev.find(p => p.id === mode.id)) {
                return prev.map(p => p.id === mode.id ? mode : p);
            }
            const newMode = { ...mode, id: `pm_${Date.now()}`};
            return [...prev, newMode];
        });
    };
    const handleDeletePaymentMode = (id: string) => setPaymentModes(p => p.filter(i => i.id !== id));

    const handleSavePaymentAccount = (account: PaymentAccount) => {
        setPaymentAccounts(prev => {
            if (prev.find(p => p.id === account.id)) {
                return prev.map(p => p.id === account.id ? account : p);
            }
             const newAccount = { ...account, id: `pa_${Date.now()}`};
            return [...prev, newAccount];
        });
    };
    const handleDeletePaymentAccount = (id: string) => setPaymentAccounts(p => p.filter(i => i.id !== id));

    const handleSaveProperty = (propertyToSave: Omit<Property, 'id' | 'customerId'> & { id?: string }) => {
        setPropertiesData(prev => {
            if (propertyToSave.id) {
                return prev.map(p => p.id === propertyToSave.id ? { ...p, ...propertyToSave } as Property : p);
            } else {
                const newProperty: Property = {
                    ...propertyToSave,
                    id: `prop${Date.now()}`,
                    customerId: 'cust1' // Default to first customer for simplicity
                } as Property;
                return [...prev, newProperty];
            }
        });
    };

    const handleDeleteProperty = (propertyId: string) => {
        if (propertiesData.length <= 1) {
            alert("You cannot delete the last property.");
            return;
        }

        setPropertiesData(prev => prev.filter(p => p.id !== propertyId));
        setRoomsData(prev => prev.filter(r => r.propertyId !== propertyId));
        setBookingsData(prev => prev.filter(b => b.propertyId !== propertyId));

        if(selectedPropertyId === propertyId) {
            const nextProperty = propertiesData.find(p => p.id !== propertyId);
            if (nextProperty) {
                setSelectedPropertyId(nextProperty.id);
            }
        }
    };
    
    const handleImportBookings = (importedData: any[]) => {
        let newGuests: Guest[] = [];
        const guestMap = new Map(guestsData.map(g => [g.name.toLowerCase(), g]));
        const roomMap = new Map(roomsData.map(r => [r.name.toLowerCase(), r]));

        const newBookings: (Omit<Booking, 'id'>)[] = importedData.map(row => {
            let guest = guestMap.get(row.guestName.toLowerCase());
            if (!guest) {
                const newGuest: Guest = {
                    id: `g${Date.now()}-${Math.random()}`,
                    name: row.guestName,
                    email: row.guestEmail || '',
                    phone: row.guestPhone || '',
                };
                newGuests.push(newGuest);
                guestMap.set(newGuest.name.toLowerCase(), newGuest);
                guest = newGuest;
            }

            const room = roomMap.get(row.roomName.toLowerCase());
            if (!room) {
                console.warn(`Could not find room: ${row.roomName}`);
                return null;
            }
            
            const checkInDate = parseDate(row.checkIn);
            const checkOutDate = parseDate(row.checkOut);

            if (!checkInDate || !checkOutDate || checkInDate > checkOutDate) {
                console.warn(`Could not parse dates or invalid date range for guest: ${row.guestName}`);
                return null;
            }

            const newBooking: Omit<Booking, 'id'> = {
                propertyId: selectedPropertyId,
                roomId: room.id,
                guestId: guest.id,
                checkIn: checkInDate.toISOString().split('T')[0],
                checkOut: checkOutDate.toISOString().split('T')[0],
                status: row.status || BookingStatus.Confirmed,
                totalPrice: parseFloat(row.totalPrice) || 0,
                payments: [],
                source: row.source || 'Imported',
                bookType: selectedProperty.managementType === 'OYO' ? (row.bookType || 'BOOK_1') : 'BOOK_1',
            };
            return newBooking;
        }).filter((b): b is Omit<Booking, 'id'> => b !== null);

        if (newGuests.length > 0) {
            setGuestsData(prev => [...prev, ...newGuests]);
        }

        setBookingsData(prev => [...prev, ...newBookings.map(b => ({...b, id: `b${Date.now()}-${Math.random()}`})) as Booking[]]);

        alert(`Successfully imported ${newBookings.length} bookings.`);
        setCurrentPage('bookings');
    };


    const handleViewChange = () => {
        setCurrentView(prev => prev === 'hotel' ? 'superadmin' : 'hotel');
    };

    const renderHotelView = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard 
                            rooms={filteredData.rooms}
                            bookings={filteredData.bookings} 
                        />;
            case 'bookings':
                return <Bookings 
                            rooms={filteredData.rooms} 
                            bookings={filteredData.bookings} 
                            guests={guestsData}
                            onSaveBooking={handleSaveBooking}
                            onDeleteBooking={handleDeleteBooking}
                            onSaveGuest={handleSaveGuest}
                            propertyId={selectedPropertyId}
                            paymentModes={paymentModes}
                            paymentAccounts={paymentAccounts}
                            platformSettings={platformSettings}
                            selectedProperty={selectedProperty}
                        />;
            case 'calendar':
                return <Calendar 
                            rooms={filteredData.rooms} 
                            bookings={filteredData.allBookingsForProperty} 
                            guests={guestsData}
                            onSaveBooking={handleSaveBooking}
                            propertyId={selectedPropertyId}
                            paymentModes={paymentModes}
                            paymentAccounts={paymentAccounts}
                            platformSettings={platformSettings}
                            selectedProperty={selectedProperty}
                        />;
            case 'import-data':
                return <ImportData
                            rooms={filteredData.rooms}
                            guests={guestsData}
                            onImportBookings={handleImportBookings}
                         />
            case 'hotels':
                return <Hotels
                            properties={propertiesData}
                            bookings={bookingsData}
                            onSaveProperty={handleSaveProperty}
                            onDeleteProperty={handleDeleteProperty}
                            platformSettings={platformSettings}
                        />;
            case 'guests':
                return <Guests 
                            guests={guestsData} 
                            bookings={filteredData.allBookings}
                            onSaveGuest={handleSaveGuest}
                            onDeleteGuest={handleDeleteGuest}
                        />;
            case 'room-management':
                 return <RoomManagement 
                            rooms={filteredData.rooms}
                            bookings={filteredData.bookings} 
                            guests={filteredData.guests}
                            onSaveRoom={handleSaveRoom}
                            onDeleteRoom={handleDeleteRoom}
                            onBulkSaveRooms={handleBulkSaveRooms}
                        />;
            case 'housekeeping':
                return <Housekeeping 
                            rooms={filteredData.rooms} 
                            bookings={filteredData.bookings}
                            guests={filteredData.guests}
                            onUpdateRoom={handleRoomUpdate}
                        />;
            case 'reports':
                return <Reports 
                            bookings={filteredData.allBookingsForProperty}
                            paymentModes={paymentModes}
                            paymentAccounts={paymentAccounts}
                            platformSettings={platformSettings}
                        />;
            case 'settings':
                return <Settings
                            settings={platformSettings}
                            onUpdateSettings={handleUpdateSettings}
                            users={usersData}
                            onSaveUser={handleSaveUser}
                            onDeleteUser={handleDeleteUser}
                            paymentModes={paymentModes}
                            paymentAccounts={paymentAccounts}
                            onSavePaymentMode={handleSavePaymentMode}
                            onDeletePaymentMode={handleDeletePaymentMode}
                            onSavePaymentAccount={handleSavePaymentAccount}
                            onDeletePaymentAccount={handleDeletePaymentAccount}
                            integrations={integrationsData}
                            onSaveIntegration={handleSaveIntegration}
                            auditLogs={mockAuditLogs}
                        />;
            default:
                setCurrentPage('dashboard');
                return <Dashboard 
                            rooms={filteredData.rooms} 
                            bookings={filteredData.bookings} 
                        />;
        }
    };

    if (currentView === 'superadmin') {
        return <SuperAdminPanel 
                    onViewChange={handleViewChange} 
                    customers={mockSaasCustomers} 
                    properties={propertiesData}
                    users={usersData}
                    systemLogs={mockSystemLogs}
                />;
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    properties={propertiesData}
                    selectedProperty={selectedProperty}
                    onPropertyChange={setSelectedPropertyId}
                    onViewChange={handleViewChange}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 md:p-8">
                    {renderHotelView()}
                </main>
            </div>
        </div>
    );
};

export default App;