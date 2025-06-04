def calculate_total_orders(start_number: int, end_number: int) -> int:
    """
    Tính toán số lượng cuống order đã dùng trong ca.
    
    Logic giống frontend: chỉ trả về 0 nếu cùng quyển và số sau nhỏ hơn số trước, còn khác quyển thì luôn tính toán bình thường.
    
    Logic tính toán:
    1. Mỗi quyển order có 100 tờ, từ xx00 đến xx99 (xx là 2 số đầu tiên)
    2. Nếu số cuối cùng nằm trong cùng quyển với số đầu:
       - Tính trực tiếp từ số đầu đến số cuối
    3. Nếu số cuối nằm ở quyển khác:
       - Phần 1: Từ số đầu đến xx99 (max của quyển đầu)
       - Phần 2: Từ yy00 đến số cuối (yy là 2 số đầu của quyển cuối)
       - Tổng = Phần 1 + Phần 2
    
    Ví dụ:
    - start_number = 1120, end_number = 1230
    - Phần 1: 1120 -> 1199 = 80 tờ (max của quyển 11)
    - Phần 2: 1200 -> 1230 = 31 tờ (quyển 12)
    - Tổng = 80 + 31 = 111 tờ
    """
    start_book = start_number // 100
    end_book = end_number // 100

    # Nếu cùng một quyển order
    if start_book == end_book:
        if end_number < start_number:
            return 0
        return end_number - start_number + 1

    # Nếu khác quyển, luôn tính toán bình thường
    # Tính số lượng order trong quyển đầu
    first_book_max = start_book * 100 + 99
    first_book_orders = first_book_max - start_number + 1
    
    # Tính số lượng order trong quyển cuối
    last_book_min = end_book * 100
    last_book_orders = end_number - last_book_min + 1
    
    # Tổng hợp kết quả
    return first_book_orders + last_book_orders