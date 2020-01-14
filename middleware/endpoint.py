from watson_developer_cloud import VisualRecognitionV3
import json
import numpy as np

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

    print(base_freshness)


"""
Sample test :
--> print(calculate_freshness_score(0.2, 0.79, 0.01, 20, 0.93, 23))
"""        