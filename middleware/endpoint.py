import sys
### This program predicts how fresh a produce is based on it's Temperature, Humidity, and VOC readongs. It also takes an image to detect other
### metrics such as appearence and Fe2O3 presense based on appearence.

### Author : Qasim Wani


# temp_avg = 20
# humidity_avg = 0.93
# VOC_level = 24
def calculate_margin(num, standard):
    """Calculates the least square error between the num and it's standard"""
    delta = (num - standard)
    delta = 0.5*delta
    return delta

def calculate_freshness_score(ripe_score, green_score, overripe_score, temp_scr, hum_scr, voc_scr):
    temp_sample = calculate_margin(temp_scr, 20)
    humid_sample = calculate_margin(hum_scr, 0.93)
    voc_sample = calculate_margin(voc_scr, 24)

    total_average = temp_sample + humid_sample + voc_sample

    base_freshness = (ripe_score)*0.6 + (green_score)*0.9 + (overripe_score)*0.2
    error_dist = abs((total_average - base_freshness)/ base_freshness)
    if(error_dist >= 0.1):
        if(total_average < 0):
            return base_freshness + 0.1
        else:
            return base_freshness - 0.1
    else:
        return base_freshness

    
def main(argv):
    data = argv[0].split(",")
    freshness_score = calculate_freshness_score(float(data[0]),float(data[1]), float(data[2]), float(data[3]), float(data[4]), float(data[5]))
    print(freshness_score)
if __name__ == "__main__":
    main(sys.argv[1:])