from sqlmodel import SQLModel, Session
from configs.db import engine
from models.station_model import Station

BLUE_NAMES = [
    "ท่าพระ","จรัญฯ 13","ไฟฉาย","บางขุนนนท์","บางยี่ขัน","สิรินธร","บางพลัด","บางอ้อ",
    "บางโพ","เตาปูน","บางซื่อ","กำแพงเพชร","สวนจตุจักร","พหลโยธิน","ลาดพร้าว","รัชดาภิเษก",
    "สุทธิสาร","ห้วยขวาง","ศูนย์วัฒนธรรมฯแห่งประเทศไทย","พระราม 9","เพชรบุรี","สุขุมวิท",
    "ศูนย์การประชุมแห่งชาติสิริกิติ์","คลองเตย","ลุมพินี","สีลม","สามย่าน","หัวลำโพง",
    "วัดมังกร","สามยอด","สนามไชย","อิสรภาพ","บางไผ่","บางหว้า","เพชรเกษม 48",
    "ภาษีเจริญ","บางแค","หลักสอง",
]

PURPLE_NAMES = [
    "คลองบางไผ่","ตลาดบางใหญ่","สามแยกบางใหญ่","บางพลู","บางรักใหญ่","บางรักน้อยท่าอิฐ",
    "ไทรม้า","สะพานพระนั่งเกล้า","แยกนนทบุรี 1","บางกระสอ","ศูนย์ราชการนนทบุรี",
    "กระทรวงสาธารณสุข","แยกติวานนท์","วงศ์สว่าง","บางซ่อน","เตาปูน"
]
BLUE_NAMES_EN = [
    "Tha Phra","Charan 13","Fai Chai","Bang Khun Non","Bang Yi Khan","Sirindhorn","Bang Phlat","Bang O",
    "Bang Pho","Tao Poon","Bang Sue","Kamphaeng Phet","Chatuchak Park","Phahon Yothin","Lat Phrao","Ratchadaphisek",
    "Sutthisan","Huai Khwang","Thailand Cultural Centre","Phra Ram 9","Phetchaburi","Sukhumvit",
    "Queen Sirikit National Convention Centre","Khlong Toei","Lumphini","Si Lom","Sam Yan","Hua Lamphong",
    "Wat Mangkon","Sam Yot","Sanam Chai","Itsaraphap","Bang Phai","Bang Wa","Phetkasem 48",
    "Phasi Charoen","Bang Khae","Lak Song",
]
PURPLE_NAMES_EN = [
    "Khlong Bang Phai","Talat Bang Yai","Sam Yaek Bang Yai","Bang Phlu","Bang Rak Yai","Bang Rak Noi Tha It",
    "Sai Ma","Phra Nang Klao Bridge","Yaek Nonthaburi 1","Bang Krasor","Nonthaburi Civic Center",
    "Ministry of Public Health","Yaek Tiwanon","Wong Sawang","Bang Son","Tao Poon"
]


INTERCHANGES = {
    "สวนจตุจักร": "BTS",
    "พหลโยธิน": "BTS",
    "สุขุมวิท": "BTS",
    "สีลม": "BTS",
    "บางหว้า": "BTS",
    "บางซื่อ": "RED",
    "เตาปูน": "PURPLE",
    "เพชรบุรี": "ARL",
    
    "ศูนย์ราชการนนทบุรี": "PINK",
    "บางซ่อน": "RED",
}

GAP = 95
MAIN_X_BL = 400
MAIN_Y_BL = 750
START_X_PP = 350
START_Y_PP = 50

def seed_stations():
    print("Starting Database Seed...")

    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    print(" Database tables reset.")

    with Session(engine) as session:
        for i, name in enumerate(BLUE_NAMES):#enumerate = function loop return เป็นคู่ (index, name)
            name_en = BLUE_NAMES_EN[i]
            x = 0
            y = 0
            
            #start BL01
            if i == 0:
                x = MAIN_X_BL
                y = MAIN_Y_BL
            elif i <= 11:
                x = MAIN_X_BL
                y = MAIN_Y_BL - (i * GAP)
            elif i <= 16:
                y = MAIN_Y_BL - (11 * GAP)
                x = MAIN_X_BL + ((i - 11) * GAP)
            elif i <= 27:
                x = MAIN_X_BL + (5 * GAP)
                y = (MAIN_Y_BL - (11 * GAP)) + ((i - 16) * GAP)
            elif i <= 31:
                y = MAIN_Y_BL
                x = (MAIN_X_BL + (5 * GAP)) - ((i - 27) * GAP)
            elif i <= 34:
                y = MAIN_Y_BL
                x = MAIN_X_BL - ((i - 31) * GAP)
            else:
                x = MAIN_X_BL - (3 * GAP)
                y = MAIN_Y_BL - ((i - 34) * GAP)
                
            connections = INTERCHANGES.get(name, None)

            session.add(Station(
                code=f"BL{str(i+1).zfill(2)}",
                name=name,
                name_en=name_en,
                line="blue",
                x=x,
                y=y,
                connect_to=connections
            ))

        for i, name in enumerate(PURPLE_NAMES):
            name_en = PURPLE_NAMES_EN[i]
            x = 0
            y = 0

            if i <= 1:
                x = START_X_PP
                y = START_Y_PP + (i * GAP)
            elif i <= 9:
                x = START_X_PP + ((i - 1) * GAP)
                y = START_Y_PP + (2 * GAP)
            else:
                x = START_X_PP + (8 * GAP)
                y = (START_Y_PP + (2 * GAP)) + ((i - 9) * GAP)
            
            connections = INTERCHANGES.get(name, None)

            session.add(Station(
                code=f"PP{str(i+1).zfill(2)}",
                name=name,
                name_en=name_en,
                line="purple",
                x=x,
                y=y,
                connect_to=connections
            ))

        session.commit()
        print(f" Stations seeded successfully. (Blue: {len(BLUE_NAMES)}, Purple: {len(PURPLE_NAMES)})")

if __name__ == "__main__":
    seed_stations()